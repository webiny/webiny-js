import { createImplementation } from "@webiny/di";
import { CliCommandFactory, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { loadJsonFileSync } from "load-json-file";
import { getDuplicatesFilePath, getReferencesFilePath } from "../paths.js";
import fs from "fs";
import { createDependencyTree } from "../createDependencyTree.js";
import type { IDependencyCollection, IReference } from "~/features/DepsSync/types.js";

/**
 * Number of offending dependencies to list in an error before summarizing the rest.
 */
const MAX_LISTED = 5;

const describeReference = (reference: IReference) => {
    const versions = reference.versions.map(version => {
        const files = version.files
            .map(file => `${file.file} (${file.types.join(", ")})`)
            .join(", ");
        return `    ${version.version} in ${files}`;
    });

    return [`  ${reference.name}`, ...versions].join("\n");
};

const describeReferences = (references: IReference[]) => {
    const listed = references.slice(0, MAX_LISTED).map(describeReference);
    const remaining = references.length - listed.length;

    if (remaining > 0) {
        listed.push(`  ...and ${remaining} more.`);
    }

    return listed.join("\n");
};

export class VerifyDepsCommand implements CliCommandFactory.Interface<unknown> {
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

                const references: IDependencyCollection = {
                    dependencies: tree.dependencies,
                    devDependencies: tree.devDependencies,
                    peerDependencies: tree.peerDependencies,
                    resolutions: tree.resolutions,
                    references: tree.references
                };

                ui.info("Checking references file...");

                if (fs.existsSync(referencesFile)) {
                    const json = loadJsonFileSync<IDependencyCollection>(referencesFile)!;
                    if (JSON.stringify(references) !== JSON.stringify(json)) {
                        for (const type in references) {
                            const refDependencies = references[type as keyof typeof references];
                            const fileDependencies = json[type as keyof typeof json];
                            for (const dep in refDependencies) {
                                const refDep = refDependencies[dep];
                                const fileDep = fileDependencies[dep];
                                if (!fileDep) {
                                    console.log("Missing dependency:", refDep.name, "in", type);
                                    continue;
                                }
                                if (JSON.stringify(refDep) !== JSON.stringify(fileDep)) {
                                    console.log("Mismatch in dependency:", refDep.name, "in", type);
                                    console.log({
                                        refDep: JSON.stringify(refDep),
                                        fileDep: JSON.stringify(fileDep)
                                    });
                                }
                            }
                        }
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
                    const json = loadJsonFileSync<IReference[]>(duplicatesFile)!;
                    if (JSON.stringify(tree.duplicates) !== JSON.stringify(json)) {
                        const fileNames = new Set(json.map(reference => reference.name));
                        const treeNames = new Set(tree.duplicates.map(reference => reference.name));

                        const added = tree.duplicates.filter(
                            reference => !fileNames.has(reference.name)
                        );
                        const removed = json.filter(reference => !treeNames.has(reference.name));
                        const changed = tree.duplicates.filter(reference => {
                            const fileReference = json.find(item => item.name === reference.name);
                            return (
                                fileReference &&
                                JSON.stringify(reference) !== JSON.stringify(fileReference)
                            );
                        });

                        const details = [
                            added.length
                                ? `New duplicates (${added.length}):\n${describeReferences(added)}`
                                : null,
                            removed.length
                                ? `Resolved duplicates (${removed.length}):\n${describeReferences(removed)}`
                                : null,
                            changed.length
                                ? `Changed duplicates (${changed.length}):\n${describeReferences(changed)}`
                                : null
                        ].filter(Boolean);

                        throw new Error(
                            [
                                "Duplicates are not in sync. Please run `yarn webiny sync-dependencies` command.",
                                ...details
                            ].join("\n\n")
                        );
                    } else if (Array.isArray(json) && json.length > 0) {
                        throw new Error(
                            [
                                "There are still duplicates in the project. Please sort them out and run `yarn webiny sync-dependencies` command to regenerate files.",
                                `Duplicate dependencies (${json.length}):\n${describeReferences(json)}`
                            ].join("\n\n")
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
    abstraction: CliCommandFactory,
    implementation: VerifyDepsCommand,
    dependencies: [GetProjectSdkService, UiService]
});
