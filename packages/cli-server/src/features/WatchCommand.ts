import { Transform } from "node:stream";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    DefaultAppsService,
    GetProjectSdkService,
    StdioService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import chalk from "chalk";

interface IServerWatchCommandParams {
    _: string[];
    app?: string;
    package?: string | string[];
}

const COLORS = [
    "#00CC00",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3366CC",
    "#33CC00",
    "#33CC99",
    "#6600CC",
    "#66CC00",
    "#9900CC",
    "#99CC00",
    "#CC0000",
    "#CC0066",
    "#CC3300",
    "#CC6600",
    "#CCCC00",
    "#FF0000",
    "#FF3300",
    "#FF6600",
    "#FF9900",
    "#FFCC00"
];

function colorForString(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * Boot (and keep booting) the built api handler as a live HTTP server, alongside the build watchers.
 *
 * The api workspace compiles to `<cwd>/.webiny/workspace/apps/api/graphql/build/handler.mjs`, which
 * (for the server flavour) exports the Node `http.Server` from `createNodeHandler`. WCP/deploy builds
 * additionally rename it to `_handler.mjs` and wrap `handler.mjs` with a telemetry client, so the
 * runner prefers `_handler.mjs` when present. We write a tiny runner next to it that imports the
 * handler and calls `.listen(PORT)`, then run it under Node's
 * built-in `--watch` scoped to the build dir — so every rebuild restarts the server in an isolated
 * child process (a server crash never kills the watcher). If the build doesn't exist yet, the runner
 * throws and `--watch` retries once the first build lands.
 */
function startApiServer(cwd: string, ui: UiService.Interface) {
    const workspaceApi = path.join(cwd, ".webiny", "workspace", "apps", "api");
    const buildDir = path.join(workspaceApi, "graphql", "build");
    const runnerPath = path.join(workspaceApi, ".serve.mjs");
    // Use a dedicated API port so it never collides with the admin dev server (rsbuild defaults to
    // 3001). Set WEBINY_API_PORT to override.
    const port = process.env.WEBINY_API_PORT || "3000";

    // Create the build dir up front so Node's `--watch-path` (below) doesn't ENOENT when the
    // first build hasn't landed yet. This also creates `workspaceApi` for the runner file.
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(
        runnerPath,
        [
            `import fs from "node:fs";`,
            `const port = Number(process.env.PORT || ${JSON.stringify(port)});`,
            // Deploy/WCP builds rename the app handler to `_handler.mjs` and put a telemetry
            // wrapper at `handler.mjs`; dev/watch builds have no telemetry and emit a plain
            // `handler.mjs`. Prefer the un-wrapped server handler when present, else the plain one.
            `const wrapped = new URL("./graphql/build/_handler.mjs", import.meta.url);`,
            `const plain = new URL("./graphql/build/handler.mjs", import.meta.url);`,
            `const target = fs.existsSync(wrapped) ? wrapped : plain;`,
            `const { handler } = await import(target.href);`,
            `handler.listen(port, () => {`,
            `    console.log("\\n🚀 Webiny API (server flavour) listening on http://localhost:" + port + "\\n");`,
            `});`,
            ``
        ].join("\n")
    );

    ui.info(`Starting api server on http://localhost:%s ...`, port);

    // `WCP_PROJECT_LICENSE` is a build-time-only var (written plaintext by applyWcpEnvVars for the
    // build-time feature-flag computation). The AWS lambda deliberately never receives it (see
    // project-aws lambdaEnvVariables magicPrefixes), so the runtime fetches + decrypts a fresh,
    // current license. Mirror that: strip it from the api runtime env so getWcpProjectLicense fetches
    // instead of reading the plaintext value.
    const { WCP_PROJECT_LICENSE: _buildTimeLicense, ...runtimeEnv } = process.env;

    const child = spawn(process.execPath, ["--watch-path", buildDir, runnerPath], {
        cwd: workspaceApi,
        stdio: "inherit",
        env: { ...runtimeEnv, PORT: port }
    });

    const cleanup = () => {
        if (!child.killed) {
            child.kill();
        }
    };
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
        cleanup();
        process.exit(0);
    });

    return child;
}

function createPrefixer(prefix: string) {
    return new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk, _encoding, callback) {
            for (const line of chunk.toString().split(/\r?\n/)) {
                if (line.trim()) {
                    this.push(`${prefix}: ${line}\n`);
                }
            }
            callback();
        }
    });
}

export class ServerWatchCommand implements CliCommandFactory.Interface<IServerWatchCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private uiService: UiService.Interface,
        private defaultAppsService: DefaultAppsService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IServerWatchCommandParams>> {
        return {
            name: "watch",
            description:
                "Watches code changes for a specific app or package. Watches all default apps if none specified.",
            examples: ["watch api", "watch admin", "watch -p my-package", "watch"],
            params: [
                {
                    name: "app",
                    description: "Name of the app to watch (api or admin)",
                    type: "string"
                }
            ],
            options: [
                {
                    name: "package",
                    alias: "p",
                    description: "One or more packages to watch for code changes",
                    type: "string"
                }
            ],
            handler: async (params: IServerWatchCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();
                const stdio = this.stdioService;
                const ui = this.uiService;

                // Decide which apps to watch.
                const apps = params.app
                    ? [params.app]
                    : !params.package
                      ? await this.defaultAppsService.execute()
                      : [];

                // Collect PackagesWatcher instances — one per app or for package-only mode.
                const watchers = [];

                if (apps.length > 0) {
                    for (const app of apps) {
                        const { packagesWatcher } = await projectSdk.watch({ app: app as any });
                        watchers.push(packagesWatcher);
                    }
                } else {
                    const whitelist = Array.isArray(params.package)
                        ? params.package
                        : ([params.package].filter(Boolean) as string[]);
                    const { packagesWatcher } = await projectSdk.watch({ package: whitelist });
                    watchers.push(packagesWatcher);
                }

                // Flatten processes from all watchers.
                const allProcessLists = watchers.map(w => w.prepare());
                const allProcesses = allProcessLists.flatMap(pl =>
                    pl.getProcesses ? pl.getProcesses() : []
                );

                if (allProcesses.length === 0) {
                    ui.warning(
                        `No watch processes were started. Please ensure you have specified a valid "app" or "package" parameter.`
                    );
                    return;
                }

                // When watching the "api" app, also boot it as a live HTTP server that reloads on
                // rebuild — so `webiny watch api` both compiles AND serves (no separate command).
                if (apps.includes("api")) {
                    startApiServer(process.cwd(), ui);
                }

                if (allProcesses.length === 1) {
                    allProcessLists[0].setForkOptions({ stdio: "inherit", env: process.env });
                    ui.info(`Watching %s package...`, allProcesses[0].pkg.name);
                    await allProcesses[0].run();
                    return;
                }

                ui.info(`Watching %s packages...`, allProcesses.length);

                stdio.getStdout().setMaxListeners(allProcesses.length + 5);
                stdio.getStderr().setMaxListeners(allProcesses.length + 5);

                for (const watchProcess of allProcesses) {
                    const prefix = chalk.hex(colorForString(watchProcess.pkg.name))(
                        watchProcess.pkg.name
                    );

                    watchProcess.pipeStdout(stdout => {
                        stdout.pipe(createPrefixer(prefix)).pipe(stdio.getStdout());
                    });

                    watchProcess.pipeStderr(stderr => {
                        stderr.pipe(createPrefixer(prefix)).pipe(stdio.getStderr());
                    });
                }

                await Promise.all(allProcesses.map(p => p.run()));
            }
        };
    }
}

export const serverWatchCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerWatchCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService, DefaultAppsService]
});
