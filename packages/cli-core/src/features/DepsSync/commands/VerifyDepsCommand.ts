import { createImplementation } from "@webiny/di-container";
import { Command, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import loadJsonFile from "load-json-file";
import { getDuplicatesFilePath, getReferencesFilePath } from "../paths.js";
import fs from "fs";
import { createDependencyTree } from "../createDependencyTree.js";

export class VerifyDepsCommand implements Command.Interface<unknown> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute() {
        return {
            name: "verify-dependencies",
            description: "Verify dependencies for all packages.",
            examples: ["$0 verify-dependencies"],
            handler: async () => {
                const ui = this.uiService;
                const projectSdk = await this.getProjectSdkService.execute();
                const project = projectSdk.getProject();
                const referencesFile = getReferencesFilePath(project);
                const duplicatesFile = getDuplicatesFilePath(project);

                const tree = createDependencyTree(project);

                const references = {
                    dependencies: tree.dependencies,
                    devDependencies: tree.devDependencies,
                    peerDependencies: tree.peerDependencies,
                    resolutions: tree.resolutions,
                    references: tree.references
                };

                ui.info("Checking references file...");

                if (fs.existsSync(referencesFile)) {
                    const json = loadJsonFile.sync(referencesFile);
                    if (JSON.stringify(references) !== JSON.stringify(json)) {
                        throw new Error(
                            "References are not in sync. Please run `yarn webiny sync-dependencies` command."
                        );
                    }
                } else {
                    throw new Error(
                        "References file does not exist. Please run `yarn webiny sync-dependencies` command."
                    );
                }

                ui.info("Checking duplicates file...");

                if (fs.existsSync(duplicatesFile)) {
                    const json = loadJsonFile.sync(duplicatesFile);
                    if (JSON.stringify(tree.duplicates) !== JSON.stringify(json)) {
                        throw new Error(
                            "Duplicates are not in sync. Please run `yarn webiny sync-dependencies` command."
                        );
                    } else if (Array.isArray(json) && json.length > 0) {
                        throw new Error(
                            "There are still duplicates in the project. Please sort them out and run `yarn webiny sync-dependencies` command to regenerate files."
                        );
                    }
                } else {
                    throw new Error(
                        "Duplicates file does not exist. Please run `yarn webiny sync-dependencies` command."
                    );
                }

                ui.info("✅  All package reference files are in sync.");
            }
        };
    }
}

export const verifyDepsCommand = createImplementation({
    abstraction: Command,
    implementation: VerifyDepsCommand,
    dependencies: [GetProjectSdkService, UiService]
});
