import { createImplementation } from "@webiny/di";
import { BeforeWatch, GetApp } from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

class EnsureAppBuiltBeforeWatch implements BeforeWatch.Interface {
    constructor(private getApp: GetApp.Interface) {}

    async execute(params: BeforeWatch.Params) {
        if (!("app" in params)) {
            return;
        }

        const app = this.getApp.execute(params.app);

        if (app.paths.workspaceFolder.existsSync()) {
            return;
        }

        const error = new Error(
            `Cannot watch ${app.getDisplayName()}. Please build the app first.`
        );
        const cmd = `yarn webiny build ${params.app} --env ${params.env}`;

        throw GracefulError.from(
            error,
            `Before watching %s, please build it first by running: %s.`,
            app.getDisplayName(),
            cmd
        );
    }
}

export default createImplementation({
    abstraction: BeforeWatch,
    implementation: EnsureAppBuiltBeforeWatch,
    dependencies: [GetApp]
});
