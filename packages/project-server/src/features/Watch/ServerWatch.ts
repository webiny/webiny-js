import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { GetProject, UiService, Watch } from "@webiny/project/abstractions/index.js";

/**
 * Boot (and keep booting) the built api handler as a live HTTP server, alongside the build watchers.
 *
 * The api workspace compiles to `<root>/.webiny/workspace/apps/api/graphql/build/handler.mjs`, which
 * (for the server flavour) exports the Node `http.Server` from `createNodeHandler`. WCP/deploy builds
 * additionally rename it to `_handler.mjs` and wrap `handler.mjs` with a telemetry client, so the
 * runner prefers `_handler.mjs` when present. We write a tiny runner next to it that imports the
 * handler and calls `.listen(PORT)`, then run it under Node's built-in `--watch` scoped to the build
 * dir — so every rebuild restarts the server in an isolated child process (a server crash never kills
 * the watcher). If the build doesn't exist yet, the runner throws and `--watch` retries once the first
 * build lands.
 */
function startApiServer(rootFolder: string, ui: UiService.Interface) {
    const workspaceApi = path.join(rootFolder, ".webiny", "workspace", "apps", "api");
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

/**
 * Server-flavour counterpart to project-aws's `AwsWatch`: where AWS forwards Lambda invocations to
 * local code, the self-hosted flavour boots the built api handler as a live HTTP server that reloads
 * on rebuild — so `webiny watch api` both compiles AND serves. Kept out of the CLI command (which
 * stays flavour-agnostic, like cli-aws) and composed only when the server flavour is registered.
 */
export class ServerWatch implements Watch.Interface {
    constructor(
        private getProject: GetProject.Interface,
        private ui: UiService.Interface,
        private decoratee: Watch.Interface
    ) {}

    async execute(params: Watch.Params): Promise<Watch.Result> {
        const result = await this.decoratee.execute(params);

        // No HTTP server for package-only watch.
        if (!("app" in params)) {
            return result;
        }

        // Only the api app builds an HTTP server handler. Name-matched here, but isolated in this
        // one flavour-owned place — swap for a capability check on the app model when available.
        if (params.app !== "api") {
            return result;
        }

        const project = this.getProject.execute();
        startApiServer(project.paths.rootFolder.toString(), this.ui);

        return result;
    }
}

export const serverWatch = Watch.createDecorator({
    decorator: ServerWatch,
    dependencies: [GetProject, UiService]
});
