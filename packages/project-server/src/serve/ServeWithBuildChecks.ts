import { GetApp, Serve } from "@webiny/project/abstractions/index.js";
import { assertApiBuilt, assertAdminBuilt } from "./builtChecks.js";

/**
 * Decorates Serve to assert the relevant app builds exist before serving. As a decorator, the checks
 * run regardless of how Serve is invoked (CLI, SDK, tests) and stay out of the serve helpers.
 */
export class ServeWithBuildChecks implements Serve.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private decoratee: Serve.Interface
    ) {}

    async execute(params: Serve.Params): Promise<Serve.Result> {
        if (!params.app || params.app === "api") {
            assertApiBuilt(this.getApp.execute("api"));
        }
        if (!params.app || params.app === "admin") {
            assertAdminBuilt(this.getApp.execute("admin"));
        }

        return this.decoratee.execute(params);
    }
}

export const serveWithBuildChecks = Serve.createDecorator({
    decorator: ServeWithBuildChecks,
    dependencies: [GetApp]
});
