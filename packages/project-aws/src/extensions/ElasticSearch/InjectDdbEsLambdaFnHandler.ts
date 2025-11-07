import { createImplementation } from "@webiny/di";
import { CoreBeforeBuild } from "@webiny/project/abstractions/index.js";
import path from "path";
import fs from "fs";
import { GetApp } from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

class InjectDdbEsLambdaFnHandler implements CoreBeforeBuild.Interface {
    constructor(private getApp: GetApp.Interface) {}

    async execute() {
        const templatesFolderPath = getTemplatesFolderPath();

        const app = this.getApp.execute("core");

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const ddbToEsHandlerTemplateFolderPath = path.join(
            templatesFolderPath,
            "extensions",
            "ElasticSearch",
            "coreDdbToEsHandler"
        );

        fs.cpSync(ddbToEsHandlerTemplateFolderPath, appWorkspaceFolderPath, {
            recursive: true
        });

        // Wait a bit and make sure the files are ready to have their content replaced.
        await wait();
    }
}

export default createImplementation({
    abstraction: CoreBeforeBuild,
    implementation: InjectDdbEsLambdaFnHandler,
    dependencies: [GetApp]
});
