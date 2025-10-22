import { Pulumi } from "@webiny/pulumi-sdk";
import { createImplementation } from "@webiny/di-container";
import { GetProjectService, GetPulumiService } from "~/abstractions/index.js";

export class DefaultGetPulumiService implements GetPulumiService.Interface {
    constructor(private readonly getProjectService: GetProjectService.Interface) {}

    async execute(params: GetPulumiService.Params = {}) {
        const project = this.getProjectService.execute();
        const { app, pulumiOptions = {} } = params;

        let cwd;
        if (app) {
            cwd = app.paths.workspaceFolder.toString();
        }

        return Pulumi.create({
            ...pulumiOptions,
            execa: { ...pulumiOptions.execa, cwd },
            pulumiFolder: project.paths.dotWebinyFolder.toString()
        });
    }
}

export const getPulumiService = createImplementation({
    abstraction: GetPulumiService,
    implementation: DefaultGetPulumiService,
    dependencies: [GetProjectService]
});
