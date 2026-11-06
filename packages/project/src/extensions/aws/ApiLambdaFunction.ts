import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";

/**
 * Spec of the `Api/LambdaFunction` extension, used by the shared `Infra` namespace. The
 * implementation, which scaffolds the function and renders its Pulumi config, is registered by
 * `@webiny/project-aws`.
 */
export const ApiLambdaFunction = defineExtension({
    type: "Api/LambdaFunction",
    tags: { runtimeContext: "app-build", appName: "api", hosting: "aws" },
    description: "Add a custom Lambda function to the API app.",
    multiple: true,
    paramsSchema: z.object({
        functionSrc: z.string(),
        pulumiSrc: z.string()
    }),
    render: () => {
        throw new Error(`"Infra.Api.LambdaFunction" requires the "@webiny/project-aws" package.`);
    }
});
