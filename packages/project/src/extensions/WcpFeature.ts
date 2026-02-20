import React, { useEffect } from "react";
import { z } from "zod";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import { defineExtension } from "~/defineExtension/index.js";
import { useWcpFeatureOverrides } from "~/components/WcpFeatureOverridesContext.js";

const paramsSchema = z.object({
    featureName: z.string().describe("The WCP feature name (e.g., 'teams', 'workflows')."),
    enabled: z.boolean().describe("Whether the feature is enabled.")
});

async function generateAdminBuildParamsFeature(buildParamsDir: string, ctx: any) {
    const featureFilePath = path.join(buildParamsDir, "feature.ts");

    const files = fs
        .readdirSync(buildParamsDir)
        .filter(f => f.startsWith("BuildParam_") && f.endsWith(".ts") && f !== "feature.ts");

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

    await updateAdminExtensionsTsx(ctx);
}

async function updateAdminExtensionsTsx(ctx: any) {
    const extensionsTsxFilePath = ctx.project.paths.workspaceFolder
        .join("apps", "admin", "src", "Extensions.tsx")
        .toString();

    const project = new Project();
    project.addSourceFileAtPath(extensionsTsxFilePath);

    const source = project.getSourceFileOrThrow(extensionsTsxFilePath);

    const buildParamsFeatureImport = "./buildParams/feature.js";
    const existingFeatureImport = source.getImportDeclaration(buildParamsFeatureImport);

    if (!existingFeatureImport) {
        let index = 1;
        const importDeclarations = source.getImportDeclarations();
        if (importDeclarations.length) {
            const last = importDeclarations[importDeclarations.length - 1];
            index = last.getChildIndex() + 1;
        }

        source.insertImportDeclaration(index, {
            namedImports: ["BuildParamsInternalFeature"],
            moduleSpecifier: buildParamsFeatureImport
        });

        const buildParamsFeatureImportPath = "@webiny/app-admin";
        const existingBuildParamsImport = source.getImportDeclaration(buildParamsFeatureImportPath);

        if (!existingBuildParamsImport) {
            source.insertImportDeclaration(index, {
                namedImports: ["BuildParamsFeature"],
                moduleSpecifier: buildParamsFeatureImportPath
            });
        } else {
            const namedImports = existingBuildParamsImport.getNamedImports();
            const hasBuildParamsFeature = namedImports.some(
                ni => ni.getName() === "BuildParamsFeature"
            );
            if (!hasBuildParamsFeature) {
                existingBuildParamsImport.addNamedImport("BuildParamsFeature");
            }
        }

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

    if (!currentContent.includes("BuildParamsFeature")) {
        const newContent = `<><RegisterFeature feature={BuildParamsFeature} /><RegisterFeature feature={BuildParamsInternalFeature} />${currentContent}</>`;
        extensionsArrowFnFragment.replaceWithText(newContent);
    }

    await source.save();
}

async function updateApiExtensions(
    extensionsTsFilePath: string,
    className: string,
    filePath: string
) {
    const project = new Project();
    project.addSourceFileAtPath(extensionsTsFilePath);

    const source = project.getSourceFileOrThrow(extensionsTsFilePath);

    let importPath = path
        .relative(path.dirname(extensionsTsFilePath), filePath)
        .replace(/\.tsx?$/, ".js");

    if (!importPath.startsWith(".")) {
        importPath = "./" + importPath;
    }

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
        defaultImport: className,
        moduleSpecifier: importPath
    });

    const pluginsArray = source.getFirstDescendant(node =>
        Node.isArrayLiteralExpression(node)
    ) as ArrayLiteralExpression;

    pluginsArray.addElement(
        `\ncreateContextPlugin(ctx => {\n\tregisterExtension(ctx.container, ${className});\n})`
    );

    {
        let index = 1;

        const importDeclarations = source.getImportDeclarations();
        if (importDeclarations.length) {
            const last = importDeclarations[importDeclarations.length - 1];
            index = last.getChildIndex() + 1;
        }

        const contextPluginImportPath = "@webiny/api/plugins/ContextPlugin";
        const existingContextPluginImport = source.getImportDeclaration(contextPluginImportPath);
        if (!existingContextPluginImport) {
            source.insertImportDeclaration(index, {
                namedImports: ["createContextPlugin"],
                moduleSpecifier: contextPluginImportPath
            });
        }
    }

    await source.save();
}

const WcpFeatureAdmin = defineExtension({
    type: "Wcp/Feature/Admin",
    tags: { runtimeContext: "app-build", appName: "admin" },
    multiple: true,
    paramsSchema,
    async build(params, ctx) {
        const { featureName, enabled } = params;
        const paramName = `wcp.feature.${featureName}`;

        const buildParamsDir = ctx.project.paths.workspaceFolder
            .join("apps", "admin", "src", "buildParams")
            .toString();

        if (!fs.existsSync(buildParamsDir)) {
            fs.mkdirSync(buildParamsDir, { recursive: true });
        }

        const hash = crypto.createHash("sha256").update(paramName).digest("hex");
        const className = `BuildParam_${hash.slice(-10)}`;
        const fileName = `${className}.ts`;
        const filePath = path.join(buildParamsDir, fileName);

        if (!fs.existsSync(filePath)) {
            const fileContent = `import { BuildParam } from "webiny/admin/buildParams";

class ${className} implements BuildParam.Interface {
    key = "${paramName}";
    value = ${JSON.stringify(enabled)};
}

export default BuildParam.createImplementation({
    implementation: ${className},
    dependencies: []
});
`;
            fs.writeFileSync(filePath, fileContent, "utf8");
        }

        await generateAdminBuildParamsFeature(buildParamsDir, ctx);
    }
});

const WcpFeatureApi = defineExtension({
    type: "Wcp/Feature/Api",
    tags: { runtimeContext: "app-build", appName: "api" },
    multiple: true,
    paramsSchema,
    async build(params, ctx) {
        const { featureName, enabled } = params;
        const paramName = `wcp.feature.${featureName}`;

        const extensionsTsFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "extensions.ts")
            .toString();

        const buildParamsDir = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "buildParams")
            .toString();

        if (!fs.existsSync(buildParamsDir)) {
            fs.mkdirSync(buildParamsDir, { recursive: true });
        }

        const hash = crypto.createHash("sha256").update(paramName).digest("hex");
        const className = `BuildParam_${hash.slice(-10)}`;
        const fileName = `${className}.ts`;
        const filePath = path.join(buildParamsDir, fileName);

        if (!fs.existsSync(filePath)) {
            const fileContent = `import { BuildParam } from "webiny/api/buildParams";

class ${className} implements BuildParam.Interface {
    key = "${paramName}";
    value = ${JSON.stringify(enabled)};
}

export default BuildParam.createImplementation({
    implementation: ${className},
    dependencies: []
});
`;
            fs.writeFileSync(filePath, fileContent, "utf8");
        }

        await updateApiExtensions(extensionsTsFilePath, className, filePath);
    }
});

interface WcpFeatureProps {
    name: string;
    enabled: boolean;
}

function WcpFeatureComponent({ name, enabled }: WcpFeatureProps) {
    const { setOverride } = useWcpFeatureOverrides();

    useEffect(() => {
        setOverride(name, enabled);
    }, [name, enabled, setOverride]);

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(WcpFeatureAdmin, { name, featureName: name, enabled }),
        React.createElement(WcpFeatureApi, { name, featureName: name, enabled })
    );
}

export const WcpFeature = WcpFeatureComponent;

export const WcpFeatureAdminDef = WcpFeatureAdmin.def;
export const WcpFeatureApiDef = WcpFeatureApi.def;

export const Wcp = {
    Feature: WcpFeatureComponent
};
