import React from "react";
import { defineExtension } from "~/defineExtension/index.js";
import { z } from "zod";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import type { WcpFeatureFlags as WcpFeatureFlagsType } from "@webiny/wcp/types.js";

const PARAM_NAME = "Wcp/FeatureFlags";

// Hash is computed from the fixed PARAM_NAME, so the file name is always deterministic.
const hash = crypto.createHash("sha256").update(PARAM_NAME).digest("hex");
const className = `BuildParam_${hash.slice(-10)}`;
const fileName = `${className}.ts`;

// Zod schema mirrors WcpFeatureFlags from @webiny/wcp/types.ts.
// Keep both in sync when adding new features.
const featureFlagsSchema = z.object({
    multiTenancy: z.object({ enabled: z.boolean().optional() }).optional(),
    advancedPublishingWorkflow: z.object({ enabled: z.boolean().optional() }).optional(),
    advancedAccessControlLayer: z
        .object({
            enabled: z.boolean().optional(),
            options: z
                .object({
                    teams: z.boolean().optional(),
                    privateFiles: z.boolean().optional(),
                    folderLevelPermissions: z.boolean().optional()
                })
                .optional()
        })
        .optional(),
    auditLogs: z.object({ enabled: z.boolean().optional() }).optional(),
    recordLocking: z.object({ enabled: z.boolean().optional() }).optional(),
    fileManager: z
        .object({
            options: z.object({ threatDetection: z.boolean().optional() }).optional()
        })
        .optional()
});

function buildParamFileContent(importPath: string, value: WcpFeatureFlagsType): string {
    const valueStr = JSON.stringify(value, null, 4);
    return `import { BuildParam } from "${importPath}";

class ${className} implements BuildParam.Interface {
    key = "${PARAM_NAME}";
    value = ${valueStr};
}

export default BuildParam.createImplementation({
    implementation: ${className},
    dependencies: []
});
`;
}

async function updateApiExtensions(
    buildParamFilePath: string,
    extensionsTsFilePath: string
): Promise<void> {
    const project = new Project();
    project.addSourceFileAtPath(extensionsTsFilePath);
    const source = project.getSourceFileOrThrow(extensionsTsFilePath);

    let importPath = path
        .relative(path.dirname(extensionsTsFilePath), buildParamFilePath)
        .replace(/\.tsx?$/, ".js");
    if (!importPath.startsWith(".")) {
        importPath = "./" + importPath;
    }

    if (source.getImportDeclaration(importPath)) {
        return;
    }

    const importDeclarations = source.getImportDeclarations();
    const index = importDeclarations.length
        ? importDeclarations[importDeclarations.length - 1].getChildIndex() + 1
        : 1;

    source.insertImportDeclaration(index, {
        defaultImport: className,
        moduleSpecifier: importPath
    });

    const pluginsArray = source.getFirstDescendant(
        node => Node.isArrayLiteralExpression(node)
    ) as ArrayLiteralExpression;

    pluginsArray.addElement(
        `\ncreateContextPlugin(ctx => {\n\tregisterExtension(ctx.container, ${className});\n})`
    );

    const contextPluginPath = "@webiny/api/plugins/ContextPlugin";
    if (!source.getImportDeclaration(contextPluginPath)) {
        source.insertImportDeclaration(index, {
            namedImports: ["createContextPlugin"],
            moduleSpecifier: contextPluginPath
        });
    }

    await source.save();
}

function generateAdminFeatureFileContent(buildParamsDir: string): string {
    const files = fs
        .readdirSync(buildParamsDir)
        .filter(f => f.startsWith("BuildParam_") && f.endsWith(".ts") && f !== "feature.ts");

    const imports = files
        .map(file => `import ${path.parse(file).name} from "./${path.parse(file).name}.js";`)
        .join("\n");

    const registrations = files
        .map(file => `        container.register(${path.parse(file).name});`)
        .join("\n");

    return `import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
${imports}

export const BuildParamsInternalFeature = createFeature({
    name: "BuildParamsInternal",
    register(container: Container) {
${registrations}
    }
});
`;
}

async function updateAdminExtensionsTsx(extensionsTsxFilePath: string): Promise<void> {
    const project = new Project();
    project.addSourceFileAtPath(extensionsTsxFilePath);
    const source = project.getSourceFileOrThrow(extensionsTsxFilePath);

    const buildParamsFeatureImport = "./buildParams/feature.js";
    if (source.getImportDeclaration(buildParamsFeatureImport)) {
        return;
    }

    const importDeclarations = source.getImportDeclarations();
    const index = importDeclarations.length
        ? importDeclarations[importDeclarations.length - 1].getChildIndex() + 1
        : 1;

    source.insertImportDeclaration(index, {
        namedImports: ["BuildParamsInternalFeature"],
        moduleSpecifier: buildParamsFeatureImport
    });

    const appAdminImport = source.getImportDeclaration("@webiny/app-admin");
    if (!appAdminImport) {
        source.insertImportDeclaration(index, {
            namedImports: ["BuildParamsFeature", "RegisterFeature"],
            moduleSpecifier: "@webiny/app-admin"
        });
    } else {
        const namedImports = appAdminImport.getNamedImports();
        if (!namedImports.some(ni => ni.getName() === "BuildParamsFeature")) {
            appAdminImport.addNamedImport("BuildParamsFeature");
        }
        if (!namedImports.some(ni => ni.getName() === "RegisterFeature")) {
            appAdminImport.addNamedImport("RegisterFeature");
        }
    }

    const extensionsIdentifier = source.getFirstDescendant(
        node => Node.isIdentifier(node) && node.getText() === "Extensions"
    );
    if (!extensionsIdentifier) {
        throw new Error(`Could not find the "Extensions" component in "${extensionsTsxFilePath}".`);
    }

    const extensionsArrowFn = extensionsIdentifier.getNextSibling(node =>
        Node.isArrowFunction(node)
    );
    if (!extensionsArrowFn) {
        throw new Error(`Could not find the "Extensions" arrow function.`);
    }

    const fragment = extensionsArrowFn.getFirstDescendant(node => Node.isJsxFragment(node));
    if (!fragment) {
        throw new Error(`Could not find JSX fragment in Extensions component.`);
    }

    const currentContent = fragment.getFullText().replace("<>", "").replace("</>", "").trim();
    if (!currentContent.includes("BuildParamsFeature")) {
        fragment.replaceWithText(
            `<><RegisterFeature feature={BuildParamsFeature} /><RegisterFeature feature={BuildParamsInternalFeature} />${currentContent}</>`
        );
    }

    await source.save();
}

// Internal extension — writes the "Wcp/FeatureFlags" build param for the API app.
const WcpApiFeatureFlagsParam = defineExtension({
    type: "Wcp/FeatureFlagsApi",
    tags: { runtimeContext: "app-build", appName: "api" },
    paramsSchema: featureFlagsSchema,
    async build(features, ctx) {
        const buildParamsDir = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "buildParams")
            .toString();

        const extensionsTsFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "extensions.ts")
            .toString();

        const filePath = path.join(buildParamsDir, fileName);

        if (!fs.existsSync(buildParamsDir)) {
            fs.mkdirSync(buildParamsDir, { recursive: true });
        }

        fs.writeFileSync(filePath, buildParamFileContent("webiny/api/buildParams", features), "utf8");
        await updateApiExtensions(filePath, extensionsTsFilePath);
    }
});

// Internal extension — writes the "Wcp/FeatureFlags" build param for the Admin app.
const WcpAdminFeatureFlagsParam = defineExtension({
    type: "Wcp/FeatureFlagsAdmin",
    tags: { runtimeContext: "app-build", appName: "admin" },
    paramsSchema: featureFlagsSchema,
    async build(features, ctx) {
        const buildParamsDir = ctx.project.paths.workspaceFolder
            .join("apps", "admin", "src", "buildParams")
            .toString();

        const extensionsTsxFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "admin", "src", "Extensions.tsx")
            .toString();

        const filePath = path.join(buildParamsDir, fileName);

        if (!fs.existsSync(buildParamsDir)) {
            fs.mkdirSync(buildParamsDir, { recursive: true });
        }

        fs.writeFileSync(
            filePath,
            buildParamFileContent("webiny/admin/buildParams", features),
            "utf8"
        );
        fs.writeFileSync(
            path.join(buildParamsDir, "feature.ts"),
            generateAdminFeatureFileContent(buildParamsDir),
            "utf8"
        );
        await updateAdminExtensionsTsx(extensionsTsxFilePath);
    }
});

const WcpFeatureFlagsExtension = defineExtension({
    type: "Wcp/FeatureFlags",
    tags: { runtimeContext: "project" },
    description: "Enable or disable WCP features.",
    paramsSchema: z.object({
        features: featureFlagsSchema.optional()
    }),
    render: ({ features = {} }) => {
        return (
            <>
                <WcpApiFeatureFlagsParam {...features} />
                <WcpAdminFeatureFlagsParam {...features} />
            </>
        );
    }
});

export const Wcp = {
    FeatureFlags: WcpFeatureFlagsExtension
};

export const wcpDefinitions = [
    WcpApiFeatureFlagsParam.def,
    WcpAdminFeatureFlagsParam.def,
    WcpFeatureFlagsExtension.def
];
