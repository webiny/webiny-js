import { GetApp, Watch } from "@webiny/project/abstractions/index.js";
import {
    ServersWatcher,
    type IServerProcessSpec
} from "@webiny/project/features/Watch/watchers/ServersWatcher.js";
import { runApiServer } from "../../serve/runApiServer.js";
import { runDevProxy } from "../../serve/runDevProxy.js";
import { getDevServerSession } from "../../serve/devServer/index.js";

/**
 * Server hosting-type counterpart to project-aws's `AwsWatch`: where AWS forwards Lambda invocations to
 * local code, the self-hosted hosting type boots the built api handler as a live HTTP server that reloads
 * on rebuild — so `webiny watch api` both compiles AND serves. Kept out of the CLI command (which
 * stays hosting-agnostic, like cli-aws) and composed only when the server hosting type is registered.
 *
 * ## Where it sits
 *
 * A `Watch` decorator, so it wraps whatever `projectSdk.watch()` already did rather than replacing it:
 *
 * ```
 *   watchWithHooks  ──▶  ServerWatch  ──▶  DefaultWatch
 *   (runs *BeforeWatch    (this file)      prepares the app workspace,
 *    hooks)                                returns { packagesWatcher }
 * ```
 *
 * The decoratee runs first and this only appends, which is why the return is a spread.
 *
 * ## One call per app, and only api gets anything
 *
 * A bare `webiny watch` never arrives here as "no app". The CLI expands it to the default app list
 * and calls the SDK once per app, so this runs twice, each time with a concrete name:
 *
 * ```
 *   webiny watch  ──▶  CLI: apps = ["api", "admin"]
 *                        │
 *                        ├─ watch({ app: "api" })    ──▶ { packagesWatcher, serversWatcher: [api, proxy?] }
 *                        └─ watch({ app: "admin" })  ──▶ { packagesWatcher }
 *                                                        │
 *                        CLI flattens every app's specs into one list ──┘
 * ```
 *
 * So the api server AND the proxy both come out of that single `api` call. Admin needs no server
 * process, because its build tool already is one: rsbuild's dev server is one of the admin
 * `packagesWatcher` processes and serves the bundle itself. That call falls through and returns
 * `result` untouched, with no `serversWatcher` key at all.
 *
 * The no-app branch below is the other shape entirely, `webiny watch -p my-package`, which compiles
 * packages and serves nothing.
 *
 * ## Nothing is spawned here
 *
 * A spec is a name and a `spawn` function nobody has called. The chain from here to a real process:
 *
 * ```
 *   ServerWatch                  builds the specs                   (this file)
 *   WatchCommand                 serversWatcher.prepare()           ──▶ RunnableServerProcess[]
 *   WatchCommand                 pipeStdout / pipeStderr            attaches its own prefixing
 *   WatchCommand                 Promise.all(processes.map(run))
 *   RunnableServerProcess.run()  calls the spec's spawn()
 *   runApiServer / runDevProxy   child_process.spawn(node, runner)  ──▶ an actual process
 * ```
 *
 * Same split `packagesWatcher` already uses for builds. Describing rather than starting is what lets
 * the CLI own terminal rendering and lifecycle, and lets api, admin and proxy output be prefixed
 * identically without any of them knowing a terminal exists.
 */
export class ServerWatch implements Watch.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private decoratee: Watch.Interface
    ) {}

    async execute(params: Watch.Params): Promise<Watch.Result> {
        const result = await this.decoratee.execute(params);

        // `watch -p my-package`: compiles packages, serves nothing.
        if (!("app" in params)) {
            return result;
        }

        const specs = this.serverProcessSpecs(params.app);

        if (specs.length === 0) {
            return result;
        }

        return { ...result, serversWatcher: new ServersWatcher(specs) };
    }

    /** Everything this hosting type runs alongside the given app's build watchers. */
    private serverProcessSpecs(appName: GetApp.AppName): IServerProcessSpec[] {
        return [...this.apiServerSpecs(appName), ...this.devProxySpecs(appName)];
    }

    /**
     * The api's own HTTP server. Still gated on the app name because only the api compiles to a
     * server handler: admin is a static bundle, served by rsbuild's own dev server during watch.
     * Without the check, `watch admin` would boot the api runner against the admin workspace.
     *
     * A name match rather than a question asked of the app, because `IAppModel` carries no capability
     * flag to ask. Worth swapping when it does.
     */
    private apiServerSpecs(appName: GetApp.AppName): IServerProcessSpec[] {
        if (appName !== "api") {
            return [];
        }

        const app = this.getApp.execute(appName);

        return [{ name: "api", spawn: () => runApiServer(app, { watch: true }) }];
    }

    /**
     * The single-port proxy, when the CLI decided this session should have one.
     *
     * Nothing to do with the api, but it has to ride along with exactly one app's watch or a session
     * ends up starting two proxies that fight over the port. api is the one guaranteed to be there
     * whenever a proxy was asked for, since a proxy only happens for an api + admin session.
     */
    private devProxySpecs(appName: GetApp.AppName): IServerProcessSpec[] {
        const session = getDevServerSession();

        if (!session || appName !== "api") {
            return [];
        }

        return [{ name: "proxy", spawn: () => runDevProxy(session) }];
    }
}

export const serverWatch = Watch.createDecorator({
    decorator: ServerWatch,
    dependencies: [GetApp]
});
