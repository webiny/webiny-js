import { createImplementation } from "@webiny/di";
import { GetProjectService, ListDeployedEnvironmentsService } from "~/abstractions/index.js";
import path from "path";
import glob from "fast-glob";
import { splitStackName } from "~/utils/index.js";

const STACK_JSONS_GLOB = ".pulumi/**/apps/core/.pulumi/stacks/**/*.json";

export class DefaultListDeployedEnvironmentsService
    implements ListDeployedEnvironmentsService.Interface
{
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        const project = this.getProjectService.execute();

        // We just get stack files for deployed Core application. That's enough
        // to determine into which environments the user has deployed their project.
        const pulumiCoreStackFilesPaths = glob.sync(STACK_JSONS_GLOB, {
            cwd: project.paths.rootFolder.toString(),
            onlyFiles: true,
            dot: true
        });

        return pulumiCoreStackFilesPaths.map(current => {
            return splitStackName(path.basename(current, ".json"));
        });
    }
}

export const listDeployedEnvironmentsService = createImplementation({
    abstraction: ListDeployedEnvironmentsService,
    implementation: DefaultListDeployedEnvironmentsService,
    dependencies: [GetProjectService]
});
