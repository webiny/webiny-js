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
 * What it returns are process SPECS, not processes: a name and a `spawn` function nobody has called
 * yet. `Watch` describes a session rather than starting one, so nothing here binds a port or writes
 * to the terminal. The caller (the CLI) turns each spec into a `RunnableServerProcess`, attaches its
 * own prefixing to the output, and runs them alongside the build watchers. Same split `packagesWatcher`
 * already uses for builds, and the reason `webiny watch` can render api, admin and proxy output
 * identically without any of them knowing about a terminal.
 */
export class ServerWatch implements Watch.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private decoratee: Watch.Interface
    ) {}

    async execute(params: Watch.Params): Promise<Watch.Result> {
        const result = await this.decoratee.execute(params);

        // Package-only watch compiles packages and serves nothing.
        if (!("app" in params)) {
            return result;
        }

        const specs = [...this.apiServerSpecs(params.app), ...this.devProxySpecs(params.app)];

        if (specs.length === 0) {
            return result;
        }

        return { ...result, serversWatcher: new ServersWatcher(specs) };
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
