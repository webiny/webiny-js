import { AbstractExtension } from "./AbstractExtension";
import path from "path";
import { EXTENSIONS_ROOT_FOLDER } from "~/utils/constants";
import chalk from "chalk";
import { ArrayLiteralExpression, Node, Project } from "ts-morph";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";
import { updateDependencies, updateWorkspaces } from "~/utils";

export class ApiExtension extends AbstractExtension {
    async link() {
        await this.addPluginToApiApp();

        // Update dependencies list in package.json.
        const packageJsonPath = path.join("apps", "api", "graphql", "package.json");
        await updateDependencies(packageJsonPath, {
            [this.params.packageName]: "1.0.0"
        });

        await updateWorkspaces(this.params.location);
    }

    getNextSteps(): string[] {
        let { location: extensionsFolderPath } = this.params;
        if (!extensionsFolderPath) {
            extensionsFolderPath = `${EXTENSIONS_ROOT_FOLDER}/${this.params.name}`;
        }

        const watchCommand = `yarn webiny watch api --env dev`;
        const indexTsxFilePath = `${extensionsFolderPath}/src/index.ts`;

        return [
            `run ${chalk.green(watchCommand)} to start a new local development session`,
            `open ${chalk.green(indexTsxFilePath)} and start coding`,
            `to install additional dependencies, run ${chalk.green(
                `yarn workspace ${this.params.packageName} add <package-name>`
            )}`
        ];
    }

    private async addPluginToApiApp() {
        const { name, packageName } = this.params;

        const extensionsFilePath = path.join("apps", "api", "graphql", "src", "extensions.ts");

        const extensionFactory = name + "ExtensionFactory";
        const importName = "{ createExtension as " + extensionFactory + " }";
        const importPath = packageName;

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

        const pluginsArray = source.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        ) as ArrayLiteralExpression;

        pluginsArray.addElement(`${extensionFactory}()`);

        await source.save();

        await formatCode(extensionsFilePath, {});
    }
}
