import { z } from "zod";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import { defineExtension } from "~/defineExtension/index.js";
import crypto from "crypto";
import path from "path";
import fs from "fs";

export const BuildParam = defineExtension({
    type: "Api/BuildParam",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Add build-time parameter to API app.",
    multiple: true,
    paramsSchema: () => {
        return z.object({
            paramName: z.string(),
            value: z.union([
                z.string(),
                z.record(z.string(), z.any()),
                z.array(z.any()),
                z.number(),
                z.boolean()
            ])
        });
    },
    async build(params, ctx) {
        const extensionsTsFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "extensions.ts")
            .toString();

        const buildParamsDir = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "buildParams")
            .toString();

        const { paramName, value } = params;

        // Serialize value to a TypeScript literal.
        const valueStr = JSON.stringify(value, null, 4);

        // Generate a unique class name based on the paramName.
        const hash = crypto.createHash("sha256").update(paramName).digest("hex");
        const className = `BuildParam_${hash.slice(-10)}`;
        const fileName = `${className}.ts`;
        const filePath = path.join(buildParamsDir, fileName);

        // Ensure buildParams directory exists.
        if (!fs.existsSync(buildParamsDir)) {
            fs.mkdirSync(buildParamsDir, { recursive: true });
        }

        // Check if file already exists.
        if (fs.existsSync(filePath)) {
            // File exists, just ensure it's imported in extensions.ts
        } else {
            // Create the BuildParam implementation file.
            const fileContent = `import { BuildParam } from "webiny/api/build-params";

class ${className} implements BuildParam.Interface {
    key = "${paramName}";
    value = ${valueStr};
}

export default BuildParam.createImplementation({
    implementation: ${className},
    dependencies: []
});
`;
            fs.writeFileSync(filePath, fileContent, "utf8");
        }

        // Now update extensions.ts to import and register this BuildParam.
        const project = new Project();
        project.addSourceFileAtPath(extensionsTsFilePath);

        const source = project.getSourceFileOrThrow(extensionsTsFilePath);

        // Calculate import path relative to extensions.ts.
        let importPath = path
            .relative(path.dirname(extensionsTsFilePath), filePath)
            .replace(/\.tsx?$/, ".js");

        // Ensure the path starts with ./
        if (!importPath.startsWith(".")) {
            importPath = "./" + importPath;
        }

        // Check if import already exists.
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

        // Add import for the BuildParam implementation.
        source.insertImportDeclaration(index, {
            defaultImport: className,
            moduleSpecifier: importPath
        });

        // Add the registration to the plugins array.
        const pluginsArray = source.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        ) as ArrayLiteralExpression;

        pluginsArray.addElement(
            `\ncreateRegisterExtensionPlugin(ctx => {\n\tregisterExtension(ctx.container, ${className});\n})`
        );

        {
            let index = 1;

            const importDeclarations = source.getImportDeclarations();
            if (importDeclarations.length) {
                const last = importDeclarations[importDeclarations.length - 1];
                index = last.getChildIndex() + 1;
            }

            const contextPluginImportPath = "@webiny/handler/plugins/RegisterExtensionPlugin.js";
            const existingContextPluginImport =
                source.getImportDeclaration(contextPluginImportPath);
            if (!existingContextPluginImport) {
                source.insertImportDeclaration(index, {
                    namedImports: ["createRegisterExtensionPlugin"],
                    moduleSpecifier: contextPluginImportPath
                });
            }
        }

        await source.save();
    }
});
