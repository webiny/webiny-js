import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { Node, Project } from "ts-morph";

async function generateBuildParamsFeature(buildParamsDir: string, ctx: any) {
    const featureFilePath = path.join(buildParamsDir, "feature.ts");

    // Get all BuildParam_*.ts files.
    const files = fs
        .readdirSync(buildParamsDir)
        .filter(f => f.startsWith("BuildParam_") && f.endsWith(".ts") && f !== "feature.ts");

    // Generate imports and registrations.
    const imports = files
        .map(file => {
            const className = path.parse(file).name;
            return `import ${className} from "./${className}.js";`;
        })
        .join("\n");

    const registrations = files
        .map(file => {
            const className = path.parse(file).name;
            return `        container.register(${className});`;
        })
        .join("\n");

    const featureContent = `import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
${imports}

export const BuildParamsInternalFeature = createFeature({
    name: "BuildParamsInternal",
    register(container: Container) {
${registrations}
    }
});
`;

    fs.writeFileSync(featureFilePath, featureContent, "utf8");

    // Now we need to update Extensions.tsx to use RegisterFeature with this feature.
    await updateExtensionsTsx(ctx);
}

async function updateExtensionsTsx(ctx: any) {
    const extensionsTsxFilePath = ctx.project.paths.workspaceFolder
        .join("apps", "admin", "src", "Extensions.tsx")
        .toString();

    const project = new Project();
    project.addSourceFileAtPath(extensionsTsxFilePath);

    const source = project.getSourceFileOrThrow(extensionsTsxFilePath);

    // Check if we already have the imports.
    const buildParamsFeatureImport = "./buildParams/feature.js";
    const existingFeatureImport = source.getImportDeclaration(buildParamsFeatureImport);

    if (!existingFeatureImport) {
        let index = 1;
        const importDeclarations = source.getImportDeclarations();
        if (importDeclarations.length) {
            const last = importDeclarations[importDeclarations.length - 1];
            index = last.getChildIndex() + 1;
        }

        // Add import for BuildParamsInternalFeature.
        source.insertImportDeclaration(index, {
            namedImports: ["BuildParamsInternalFeature"],
            moduleSpecifier: buildParamsFeatureImport
        });

        // Add import for BuildParamsFeature.
        const buildParamsFeatureImportPath = "@webiny/app-admin";
        const existingBuildParamsImport = source.getImportDeclaration(buildParamsFeatureImportPath);

        if (!existingBuildParamsImport) {
            source.insertImportDeclaration(index, {
                namedImports: ["BuildParamsFeature"],
                moduleSpecifier: buildParamsFeatureImportPath
            });
        } else {
            // Add to existing import if BuildParamsFeature not already there.
            const namedImports = existingBuildParamsImport.getNamedImports();
            const hasBuildParamsFeature = namedImports.some(
                ni => ni.getName() === "BuildParamsFeature"
            );
            if (!hasBuildParamsFeature) {
                existingBuildParamsImport.addNamedImport("BuildParamsFeature");
            }
        }

        // Add import for RegisterFeature if not present.
        const registerFeatureImportPath = "@webiny/app-admin";
        const existingRegisterFeatureImport =
            source.getImportDeclaration(registerFeatureImportPath);

        if (existingRegisterFeatureImport) {
            const namedImports = existingRegisterFeatureImport.getNamedImports();
            const hasRegisterFeature = namedImports.some(ni => ni.getName() === "RegisterFeature");
            if (!hasRegisterFeature) {
                existingRegisterFeatureImport.addNamedImport("RegisterFeature");
            }
        } else {
            source.insertImportDeclaration(index, {
                namedImports: ["RegisterFeature"],
                moduleSpecifier: registerFeatureImportPath
            });
        }
    }

    // Now add <RegisterFeature> components to the Extensions component.
    const extensionsIdentifier = source.getFirstDescendant(node => {
        if (!Node.isIdentifier(node)) {
            return false;
        }
        return node.getText() === "Extensions";
    });

    if (!extensionsIdentifier) {
        throw new Error(
            `Could not find the "Extensions" React component in "${extensionsTsxFilePath}".`
        );
    }

    const extensionsArrowFn = extensionsIdentifier.getNextSibling(node =>
        Node.isArrowFunction(node)
    );

    if (!extensionsArrowFn) {
        throw new Error(`Could not find the "Extensions" React component arrow function.`);
    }

    const extensionsArrowFnFragment = extensionsArrowFn.getFirstDescendant(node => {
        return Node.isJsxFragment(node);
    });

    if (!extensionsArrowFnFragment) {
        throw new Error(`Could not find JSX fragment in Extensions component.`);
    }

    const currentContent = extensionsArrowFnFragment
        .getFullText()
        .replace("<>", "")
        .replace("</>", "")
        .trim();

    // Check if we already have the RegisterFeature components.
    if (!currentContent.includes("BuildParamsFeature")) {
        const newContent = `<><RegisterFeature feature={BuildParamsFeature} /><RegisterFeature feature={BuildParamsInternalFeature} />${currentContent}</>`;
        extensionsArrowFnFragment.replaceWithText(newContent);
    }

    await source.save();
}

export const AdminBuildParam = defineExtension({
    type: "Admin/BuildParam",
    tags: { runtimeContext: "app-build", appName: "admin" },
    description: "Add build-time parameter to Admin app.",
    multiple: true,
    paramsSchema: () => {
        return z.object({
            paramName: z.string(),
            value: z.union([
                z.string(),
                z.record(z.any()),
                z.array(z.any()),
                z.number(),
                z.boolean()
            ])
        });
    },
    async build(params, ctx) {
        const buildParamsDir = ctx.project.paths.workspaceFolder
            .join("apps", "admin", "src", "buildParams")
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
        if (!fs.existsSync(filePath)) {
            // Create the BuildParam implementation file.
            const fileContent = `import { BuildParam } from "webiny/admin/build-params";

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

        // Now we need to generate/update the feature file that imports all BuildParams.
        await generateBuildParamsFeature(buildParamsDir, ctx);
    }
});
