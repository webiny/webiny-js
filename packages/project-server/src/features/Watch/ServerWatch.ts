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
 */
export class ServerWatch implements Watch.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private decoratee: Watch.Interface
    ) {}

    async execute(params: Watch.Params): Promise<Watch.Result> {
        const result = await this.decoratee.execute(params);

        // No HTTP server for package-only watch.
        if (!("app" in params)) {
            return result;
        }

        // Only the api app builds an HTTP server handler. Name-matched here, but isolated in this
        // one hosting-owned place — swap for a capability check on the app model when available.
        if (params.app !== "api") {
            return result;
        }

        const app = this.getApp.execute(params.app);

        const specs: IServerProcessSpec[] = [
            { name: "api", spawn: () => runApiServer(app, { watch: true }) }
        ];

        // The single-port proxy in front of api + admin, when the CLI asked for one. Attached to the
        // api watch because that's the one app guaranteed to be in such a session, and attaching it
        // to both would run two of them.
        const session = getDevServerSession();
        if (session) {
            specs.push({ name: "proxy", spawn: () => runDevProxy(session) });
        }

        // Hand the server processes upstream as a lazy ServersWatcher (wrapped like the build
        // watchers' packagesWatcher) rather than spawning/rendering them here — the caller (e.g. the
        // CLI) prepares + runs them and owns terminal output + lifecycle.
        return { ...result, serversWatcher: new ServersWatcher(specs) };
    }
}

export const serverWatch = Watch.createDecorator({
    decorator: ServerWatch,
    dependencies: [GetApp]
});
