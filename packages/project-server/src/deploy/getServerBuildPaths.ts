import { GetProjectService } from "@webiny/project/abstractions/index.js";

export interface ServerBuildPaths {
    // Project root — where node_modules lives; the base nft traces against.
    projectRoot: string;
    // The api graphql app's build output folder — the deploy artifact we assemble.
    buildDir: string;
}

export const getServerBuildPaths = (
    getProjectService: GetProjectService.Interface
): ServerBuildPaths => {
    const project = getProjectService.execute();
    return {
        projectRoot: project.paths.rootFolder.toString(),
        buildDir: project.paths.workspaceFolder.join("apps", "api", "graphql", "build").toString()
    };
};
