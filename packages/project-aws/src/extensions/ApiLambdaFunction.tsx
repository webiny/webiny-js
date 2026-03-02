import React from "react";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { replaceInPath } from "replace-in-path";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { ExtensionSrcResolver } from "@webiny/project/utils/index.js";
import { ApiPulumi as ApiPulumiAbstraction } from "@webiny/project/abstractions/features/pulumi/index.js";
import { ApiPulumi } from "@webiny/project/extensions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

export const ApiLambdaFunction = defineExtension({
    type: "Api/LambdaFunction",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Add a custom Lambda function to the API app.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            functionSrc: zodSrcPath({ project }),
            pulumiSrc: zodSrcPath({ project, abstraction: ApiPulumiAbstraction })
        });
    },
    async build(params, ctx) {
        const absoluteFunctionSrc = ExtensionSrcResolver.resolvePath(
            params.functionSrc,
            ctx.project
        );

        // Derive function name from the handler file name (without extension).
        const functionName = path.parse(absoluteFunctionSrc).name;

        const fnWorkspacePath = ctx.project.paths.workspaceFolder
            .join("apps", "api", functionName)
            .toString();

        // 1. Scaffold from template if the folder doesn't exist yet.
        if (!fs.existsSync(fnWorkspacePath)) {
            const templatePath = path.join(
                getTemplatesFolderPath(),
                "extensions",
                "ApiLambdaFunction"
            );

            fs.cpSync(templatePath, fnWorkspacePath, { recursive: true });

            // Replace the {{functionName}} placeholder in package.json.
            replaceInPath(path.join(fnWorkspacePath, "package.json"), {
                find: "{{functionName}}",
                replaceWith: functionName
            });
        }

        // 2. Copy user's handler file → <functionName>/src/handler.ts.
        const srcDir = path.join(fnWorkspacePath, "src");
        fs.mkdirSync(srcDir, { recursive: true });
        fs.copyFileSync(absoluteFunctionSrc, path.join(srcDir, "handler.ts"));
    },
    render(props) {
        return <ApiPulumi src={props.pulumiSrc} />;
    }
});
