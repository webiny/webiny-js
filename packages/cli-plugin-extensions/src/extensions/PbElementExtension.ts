import { AbstractExtension } from "./AbstractExtension";
import path from "path";
import { EXTENSIONS_ROOT_FOLDER } from "~/utils/constants";
import chalk from "chalk";
import { JsxFragment, Node, Project } from "ts-morph";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";
import { updateDependencies, updateWorkspaces } from "~/utils";

export class PbElementExtension extends AbstractExtension {
    async link() {
        await this.addPluginToApp("admin");
        await this.addPluginToApp("website");

        const adminPackageJsonPath = path.join("apps", "admin", "package.json");
        await updateDependencies(adminPackageJsonPath, {
            [this.params.packageName]: "1.0.0"
        });

        const websitePackageJsonPath = path.join("apps", "website", "package.json");
        await updateDependencies(websitePackageJsonPath, {
            [this.params.packageName]: "1.0.0"
        });

        await updateWorkspaces(this.params.location);
    }

    getNextSteps(): string[] {
        let { location: extensionsFolderPath } = this.params;
        if (!extensionsFolderPath) {
            extensionsFolderPath = `${EXTENSIONS_ROOT_FOLDER}/${this.params.name}`;
        }

        const watchCommandAdmin = `yarn webiny watch admin --env dev`;
        const watchCommandWebsite = `yarn webiny watch website --env dev`;
        const indexTsxFilePath = `${extensionsFolderPath}/src/index.tsx`;

        return [
            [
                `run the following commands to start local development sessions:`,
                `  ∙ ${chalk.green(watchCommandAdmin)}`,
                `  ∙ ${chalk.green(watchCommandWebsite)}`
            ].join("\n"),

            `open ${chalk.green(indexTsxFilePath)} and start coding`
        ];
    }

    private async addPluginToApp(app: "admin" | "website") {
        const { name: extensionName, packageName } = this.params;

        const extensionsFilePath = path.join("apps", app, "src", "Extensions.tsx");

        const ucFirstExtName = extensionName.charAt(0).toUpperCase() + extensionName.slice(1);
        const componentName = ucFirstExtName + "Extension";

        const importName = "{ Extension as " + componentName + " }";
        const importPath = packageName + "/src/" + app;

        const project = new Project();
        project.addSourceFileAtPath(extensionsFilePath);

        const source = project.getSourceFileOrThrow(extensionsFilePath);

        const existingImportDeclaration = source.getImportDeclaration(importPath);
        if (existingImportDeclaration) {
            return;
        }

        let index = 1;

        const importDeclarations = source.getImportDeclarations();
        if (importDeclarations.length) {
            const last = importDeclarations[importDeclarations.length - 1];
            index = last.getChildIndex() + 1;
        }

        source.insertImportDeclaration(index, {
            defaultImport: importName,
            moduleSpecifier: importPath
        });

        const extensionsIdentifier = source.getFirstDescendant(node => {
            if (!Node.isIdentifier(node)) {
                return false;
            }

            return node.getText() === "Extensions";
        });

        if (!extensionsIdentifier) {
            throw new Error(
                `Could not find the "Extensions" React component in "${extensionsFilePath}". Did you maybe change the name of the component?`
            );
        }

        const extensionsArrowFn = extensionsIdentifier.getNextSibling(node =>
            Node.isArrowFunction(node)
        );
        if (!extensionsArrowFn) {
            throw new Error(
                `Could not find the "Extensions" React component in "${extensionsFilePath}". Did you maybe change its definition? It should be an arrow function.`
            );
        }

        const extensionsArrowFnFragment = extensionsArrowFn.getFirstDescendant(node => {
            return Node.isJsxFragment(node);
        }) as JsxFragment;

        const extensionsArrowFnFragmentChildrenText = extensionsArrowFnFragment
            .getFullText()
            .replace("<>", "")
            .replace("</>", "")
            .trim();

        extensionsArrowFnFragment.replaceWithText(
            `<><${componentName}/>${extensionsArrowFnFragmentChildrenText}</>`
        );

        await source.save();

        await formatCode(extensionsFilePath, {});
    }
}
