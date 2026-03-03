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

        // Ensure import { Project } from "webiny/extensions".
        const hasProjectImport = sourceFile
            .getImportDeclarations()
            .some(
                decl =>
                    decl.getModuleSpecifierValue() === "webiny/extensions" &&
                    decl.getNamedImports().some(imp => imp.getName() === "Project")
            );
        if (!hasProjectImport) {
            sourceFile.insertImportDeclaration(0, {
                namedImports: ["Project"],
                moduleSpecifier: "webiny/extensions"
            });
        }

        const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);

        // Check for existing <Project.Id />.
        const existingProjectIdEl = jsxElements.find(
            el => el.getTagNameNode().getText() === "Project.Id"
        );
        if (existingProjectIdEl) {
            if (options.force !== true) {
                throw new Error("Project.Id already exists in the file.");
            }
            // Update the id attribute in-place.
            const idAttr = existingProjectIdEl
                .getAttributes()
                .find(attr => attr.getFirstChildByKind(SyntaxKind.Identifier)?.getText() === "id");
            if (idAttr) {
                idAttr.replaceWithText(`id={"${id}"}`);
            } else {
                existingProjectIdEl.replaceWithText(`<Project.Id id={"${id}"} />`);
            }
            await sourceFile.save();
            return;
        }

        /* Determine the insertion point — after the last <Project.*> sibling element.
           Fall back to inserting after the opening tag of the outermost JSX fragment. */
        const projectEls = jsxElements.filter(el =>
            el.getTagNameNode().getText().startsWith("Project.")
        );

        if (projectEls.length > 0) {
            const lastProjectEl = projectEls[projectEls.length - 1];
            sourceFile.insertText(
                lastProjectEl.getEnd(),
                `\n            <Project.Id id={"${id}"} />`
            );
        } else {
            // Fallback: insert as first child of the outermost JSX fragment.
            const fragment = sourceFile.getFirstDescendantByKind(SyntaxKind.JsxFragment);
            if (!fragment) {
                throw new Error(
                    `Could not find a JSX fragment or <Project.*> element to anchor <Project.Id /> in ${webinyConfigFileTsx}`
                );
            }
            const openingFragment = fragment.getOpeningFragment();
            sourceFile.insertText(
                openingFragment.getEnd(),
                `\n            <Project.Id id={"${id}"} />`
            );
        }

        await sourceFile.save();
    }
}

export const setProjectIdService = createImplementation({
    abstraction: SetProjectIdService,
    implementation: DefaultSetProjectIdService,
    dependencies: [GetProjectService]
});
