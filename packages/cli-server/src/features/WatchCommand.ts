import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    DefaultAppsService,
    GetProjectSdkService,
    StdioService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import chalk from "chalk";
import { colorForString, createPrefixer } from "./terminalPrefix.js";
import { createWatchServerPrefixer } from "./serverProcesses.js";
import { WatchSummary } from "./WatchSummary.js";
import { WatchOutputGate } from "./WatchOutputGate.js";
import { WatchStartup } from "./WatchStartup.js";
import { type Watch } from "@webiny/project/abstractions/index.js";
import {
    prepareDevServerSession,
    startDevProxy
} from "@webiny/project-server/serve/devServer/index.js";

interface IServerWatchCommandParams {
    _: string[];
    app?: string;
    package?: string | string[];
    verbose?: boolean;
    proxy?: boolean;
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
            description: [
                "Watches code changes for a specific app or package. Watches all default apps if none specified.",
                "",
                "Watching several apps at once puts a proxy in front of them, so there is one URL to open:",
                "it serves admin, and forwards /api to the api. The proxy takes WEBINY_PORT (else PORT,",
                "else the port this project used last time, else the first free port from 3001), and gives",
                "api and admin ports of their own that nobody has to type. Pass --no-proxy (or set",
                "WEBINY_PROXY=off) to run the apps on separate ports instead.",
                "",
                "Ports, when running without the proxy:",
                " ‣ api:   WEBINY_API_PORT (else PORT, else 3002)",
                " ‣ admin: WEBINY_ADMIN_PORT (else PORT, else 3001)",
                "PORT applies only when watching a single app (watch api / watch admin)."
            ].join("\n"),
            examples: [
                "watch",
                "watch api",
                "watch admin",
                "watch -p my-package",
                "WEBINY_PORT=4000 watch",
                "watch --no-proxy"
            ],
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
                },
                {
                    name: "verbose",
                    description:
                        "Show all output as it happens, instead of holding the startup burst back until the apps are up. Also lists the individual app URLs behind the proxy.",
                    type: "boolean"
                },
                {
                    name: "proxy",
                    description:
                        "Put a single-port proxy in front of the watched apps (default: on when watching several)",
                    type: "boolean",
                    default: true
                }
            ],
            handler: async (params: IServerWatchCommandParams) => {
                const stdio = this.stdioService;
                const ui = this.uiService;

                // Decide which apps to watch. Unlike cli-aws (where each app watch attaches to its own
                // cloud environment and must be run separately), self-hosted watches every default app
                // in a single process, so a bare `webiny watch` is all a developer needs.
                let apps: string[] = [];
                if (params.app) {
                    apps = [params.app];
                } else if (!params.package) {
                    apps = await this.defaultAppsService.execute();

                    if (apps.length === 0) {
                        ui.error(
                            `Please specify an app to watch, for example: %s`,
                            "webiny watch api"
                        );
                        return;
                    }
                }

                // Before the `projectSdk.watch()` calls below, which is what matters: those are where
                // each app's workspace is prepared and its config re-rendered, so that's where the
                // URLs set here are picked up. See prepareDevServerSession.
                const session = await prepareDevServerSession({
                    apps,
                    enabled: params.proxy,
                    pointAppsAtProxy: true
                });

                const projectSdk = await this.getProjectSdkService.execute();

                // Without the proxy, several apps in one process means a generic PORT injected by the
                // environment can only belong to one of them, so drop it and let each app fall back to
                // its own dedicated port. Same rule `webiny serve` applies when serving both apps at
                // once. Has to happen before the watchers are prepared below: that is where each forked
                // process snapshots the env.
                if (!session && apps.length > 1 && process.env.PORT) {
                    ui.warning(
                        `%s is ignored when watching several apps at once. Set %s and %s instead.`,
                        "PORT",
                        "WEBINY_API_PORT",
                        "WEBINY_ADMIN_PORT"
                    );
                    delete process.env.PORT;
                }

                // Bind the public port now, before the workspaces are prepared below. That stretch is
                // slow and silent, and a developer who opens the URL during it should get a page that
                // waits for the apps rather than a connection error.
                const proxy = session
                    ? await startDevProxy({ port: session.port, ...session.targets })
                    : undefined;

                // With a single app the app's own startup line is easy enough to spot; with several, the
                // "where is each app running" answer would otherwise be buried in interleaved build output.
                const gated = apps.length > 1 && !params.verbose;

                // Everything goes through the gate so that piping into it, rather than straight into
                // stdout, is the only path — a plain `.pipe(stdout)` ends stdout as soon as the first
                // child stream ends, silencing the rest. When not gating it just passes output straight
                // through.
                const gate = new WatchOutputGate(stdio, ui, {
                    open: !gated,
                    onActivity: () => startup.noteOutput()
                });

                // The summary collects what the apps report; WatchStartup decides when that adds up to
                // "started" and releases both. Same path whether or not output is held back: a URL alone
                // doesn't mean an app finished starting, so `--verbose` waits for the ready markers too
                // rather than claiming "Ready" the moment rsbuild binds its port.
                const summary =
                    apps.length > 1
                        ? new WatchSummary(ui, Date.now(), () => startup.noteProgress())
                        : undefined;

                if (proxy) {
                    summary?.setPublicUrl(proxy.url, { showAppUrls: params.verbose });
                }

                const startup = new WatchStartup(gate, summary);

                // Printed before the `projectSdk.watch()` calls below, not after: those prepare each
                // app's workspace and evaluate its config, which is a slow, silent stretch. Announcing
                // the start afterwards left "Ready in Xs" reporting time the developer never saw pass.
                if (summary) {
                    ui.emptyLine();
                    ui.info(`Starting...`);
                }

                // Collect PackagesWatcher instances (one per app or for package-only mode) plus any
                // long-running server processes the hosting type attaches (e.g. the api HTTP server).
                // The app each watcher belongs to is kept alongside it so a dev server URL found in the
                // output can be attributed back to an app.
                const processLists: { app?: string; processes: Watch.BuildProcesses }[] = [];
                const serverProcesses: Watch.Process[] = [];

                if (apps.length > 0) {
                    for (const app of apps) {
                        summary?.expect(app);

                        const { packagesWatcher, serversWatcher } = await projectSdk.watch({
                            app: app as any
                        });
                        processLists.push({ app, processes: packagesWatcher.prepare() });
                        if (serversWatcher) {
                            serverProcesses.push(...serversWatcher.prepare());
                        }
                    }
                } else {
                    const whitelist = Array.isArray(params.package)
                        ? params.package
                        : ([params.package].filter(Boolean) as string[]);
                    const { packagesWatcher } = await projectSdk.watch({ package: whitelist });
                    processLists.push({ processes: packagesWatcher.prepare() });
                }

                // Flatten processes from all watchers, each still tagged with its app.
                const allProcesses = processLists.flatMap(({ app, processes }) =>
                    (processes.getProcesses ? processes.getProcesses() : []).map(process => ({
                        app,
                        process
                    }))
                );

                if (allProcesses.length === 0 && serverProcesses.length === 0) {
                    ui.warning(
                        `No watch processes were started. Please ensure you have specified a valid "app" or "package" parameter.`
                    );
                    await proxy?.close();
                    return;
                }

                // Fast path: a single build process and nothing else — inherit stdio, no prefixing.
                if (allProcesses.length === 1 && serverProcesses.length === 0) {
                    processLists[0].processes.setForkOptions({
                        stdio: "inherit",
                        env: process.env
                    });
                    ui.info(`Watching %s package...`, allProcesses[0].process.pkg.name);
                    await allProcesses[0].process.run();
                    return;
                }

                if (!summary) {
                    ui.info(`Watching %s packages...`, allProcesses.length);
                }

                const listenerCount = allProcesses.length + serverProcesses.length + 5;
                stdio.getStdout().setMaxListeners(listenerCount);
                stdio.getStderr().setMaxListeners(listenerCount);

                for (const { app, process: watchProcess } of allProcesses) {
                    const name = watchProcess.pkg.name;
                    const prefix = chalk.hex(colorForString(name))(name);

                    // Only one package per app runs a dev server (admin's rsbuild); the rest never print
                    // a URL or a ready line, so watching every package's stdout for them costs nothing
                    // and avoids having to identify that package up front.
                    const signals =
                        summary && app
                            ? {
                                  onUrl: (url: string) => summary.reportUrl(app, url),
                                  onReady: () => summary.reportReady(app)
                              }
                            : {};

                    watchProcess.pipeStdout(stdout => {
                        stdout
                            .pipe(createPrefixer(prefix, signals))
                            .pipe(gate.sink(name, "stdout"));
                    });

                    watchProcess.pipeStderr(stderr => {
                        stderr.pipe(createPrefixer(prefix)).pipe(gate.sink(name, "stderr"));
                    });
                }

                // Render the hosting type's server processes (filtered/prefixed) then run them alongside
                // the build watchers.
                for (const serverProcess of serverProcesses) {
                    const name = serverProcess.name;
                    const prefix = chalk.hex(colorForString(name))(name);
                    const signals = summary
                        ? {
                              onUrl: (url: string) => summary.reportUrl(name, url),
                              onReady: () => summary.reportReady(name)
                          }
                        : {};

                    serverProcess.pipeStdout(stdout => {
                        stdout
                            .pipe(createWatchServerPrefixer(prefix, signals))
                            .pipe(gate.sink(name, "stdout"));
                    });
                    serverProcess.pipeStderr(stderr => {
                        stderr
                            .pipe(createWatchServerPrefixer(prefix))
                            .pipe(gate.sink(name, "stderr"));
                    });
                }

                startup.begin();

                // A watch process settling at all during startup means something went wrong, so give up
                // holding output back and replay it: the reason belongs on screen, not in a buffer.
                try {
                    await Promise.all([
                        ...allProcesses.map(({ process }) =>
                            process.run().finally(() => startup.abandon())
                        ),
                        ...serverProcesses.map(p => p.run().finally(() => startup.abandon()))
                    ]);
                } finally {
                    startup.dispose();
                    await proxy?.close();
                }
            }
        };
    }
}

export const serverWatchCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerWatchCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService, DefaultAppsService]
});
