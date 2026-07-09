import { GetApp, UiService, Watch } from "@webiny/project/abstractions/index.js";
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

        const app = this.getApp.execute(params.app);
        await runApiServer(app, this.ui, { watch: true });

        return result;
    }
}

export const serverWatch = Watch.createDecorator({
    decorator: ServerWatch,
    dependencies: [GetApp, UiService]
});
