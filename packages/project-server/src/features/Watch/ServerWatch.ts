import { GetApp, Watch } from "@webiny/project/abstractions/index.js";
import { ServersWatcher } from "@webiny/project/features/Watch/watchers/ServersWatcher.js";
import { runApiServer } from "../../serve/runApiServer.js";

/**
 * Server-flavour counterpart to project-aws's `AwsWatch`: where AWS forwards Lambda invocations to
 * local code, the self-hosted flavour boots the built api handler as a live HTTP server that reloads
 * on rebuild — so `webiny watch api` both compiles AND serves. Kept out of the CLI command (which
 * stays flavour-agnostic, like cli-aws) and composed only when the server flavour is registered.
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
        // one flavour-owned place — swap for a capability check on the app model when available.
        if (params.app !== "api") {
            return result;
        }

        const app = this.getApp.execute(params.app);

        // Hand the server process upstream as a lazy ServersWatcher (wrapped like the build watchers'
        // packagesWatcher) rather than spawning/rendering it here — the caller (e.g. the CLI) prepares
        // + runs it and owns terminal output + lifecycle.
        return {
            ...result,
            serversWatcher: new ServersWatcher([
                { name: "api", spawn: () => runApiServer(app, { watch: true }) }
            ])
        };
    }
}

export const serverWatch = Watch.createDecorator({
    decorator: ServerWatch,
    dependencies: [GetApp]
});
