import { createImplementation } from "@webiny/di";
import { GetProjectService, SetProjectIdService } from "~/abstractions/index.js";
import { Project as TsMorphProject, SyntaxKind } from "ts-morph";

class DefaultSetProjectIdService implements SetProjectIdService.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute(id: string, options: SetProjectIdService.Options = {}) {
        const project = this.getProjectService.execute();
        const webinyConfigFileTsx = project.paths.webinyConfigFile.toString();

        const tsMorphProject = new TsMorphProject();
        const sourceFile = tsMorphProject.addSourceFileAtPath(webinyConfigFileTsx);

        // Ensure import { Project } from "@webiny/extensions";
        const hasProjectImport = sourceFile
            .getImportDeclarations()
            .some(
                decl =>
                    decl.getModuleSpecifierValue() === "@webiny/extensions" &&
                    decl.getNamedImports().some(imp => imp.getName() === "Project")
            );
        if (!hasProjectImport) {
            sourceFile.insertImportDeclaration(0, {
                namedImports: ["Project"],
                moduleSpecifier: "@webiny/extensions"
            });
        }

        // Find <Webiny />
        const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
        const webinyEl = jsxElements.find(el => el.getTagNameNode().getText() === "Webiny");
        if (!webinyEl) {
            throw new Error(`Could not find <Webiny /> in ${webinyConfigFileTsx}`);
        }

        // Check for <Project.Id />
        const hasProjectId = jsxElements.some(el => el.getTagNameNode().getText() === "Project.Id");
        if (hasProjectId) {
            if (options.force !== true) {
                throw new Error("Project.Id already exists in the file.");
            } else {
                // Remove existing <Project.Id />
                const projectIdEl = jsxElements.find(
                    el => el.getTagNameNode().getText() === "Project.Id"
                );
                if (projectIdEl) {
                    projectIdEl.replaceWithText("");
                }
            }
        }

        // Insert after <Webiny />
        const insertPos = webinyEl.getEnd();
        sourceFile.insertText(insertPos, `\n            <Project.Id id={"${id}"} />`);

        await sourceFile.save();
    }
}

export const setProjectIdService = createImplementation({
    abstraction: SetProjectIdService,
    implementation: DefaultSetProjectIdService,
    dependencies: [GetProjectService]
});
