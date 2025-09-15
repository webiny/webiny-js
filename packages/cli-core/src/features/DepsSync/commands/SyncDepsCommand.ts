import { createImplementation } from "@webiny/di-container";
import { Command, GetProjectSdkService, UiService } from "~/abstractions/index.js";

import { createDependencyTree } from "../createDependencyTree.js";
import { createReferenceFile } from "../createReferenceFile.js";

export class SyncDepsCommand implements Command.Interface<unknown> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute() {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "sync-dependencies",
            description: "Sync dependencies for all packages.",
            examples: ["$0 sync-dependencies"],
            handler: async () => {
                const project = projectSdk.getProject();
                const tree = createDependencyTree(project);

                return createReferenceFile(project, tree, { uiService: this.uiService });
            }
        };
    }
}

export const syncDepsCommand = createImplementation({
    abstraction: Command,
    implementation: SyncDepsCommand,
    dependencies: [GetProjectSdkService, UiService]
});
