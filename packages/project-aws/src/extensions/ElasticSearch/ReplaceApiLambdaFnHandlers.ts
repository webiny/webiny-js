import { createImplementation } from "@webiny/di";
import { ApiBeforeBuild } from "@webiny/project/abstractions/index.js";
import path from "path";
import fs from "fs";
import { GetApp } from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

class ReplaceApiLambdaFnHandlers implements ApiBeforeBuild.Interface {
    constructor(private getApp: GetApp.Interface) {}

    async execute() {
        const templatesFolderPath = getTemplatesFolderPath();

        const app = this.getApp.execute("api");

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const apiLambdaFnHandlersFolderPath = path.join(
            templatesFolderPath,
            "extensions",
            "ElasticSearch",
            "api"
        );

        fs.cpSync(apiLambdaFnHandlersFolderPath, appWorkspaceFolderPath, {
            recursive: true,
            force: true
        });

        // Wait a bit and make sure the files are ready to have their content replaced.
        await wait();
    }
}

export default createImplementation({
    abstraction: ApiBeforeBuild,
    implementation: ReplaceApiLambdaFnHandlers,
    dependencies: [GetApp]
});
