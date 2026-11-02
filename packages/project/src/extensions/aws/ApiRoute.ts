import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";

export const HTTP_METHODS = [
    "DELETE",
    "GET",
    "HEAD",
    "PATCH",
    "POST",
    "PUT",
    "OPTIONS",
    "ANY"
] as const;

/**
 * Spec of the `Api/Route` extension, used by the shared `Api` namespace. The implementation,
 * which registers the route with the API handler and with API Gateway, is registered by
 * `@webiny/project-aws`.
 */
export const ApiRoute = defineExtension({
    type: "Api/Route",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Register a custom REST route on the API Gateway + GraphQL Lambda.",
    multiple: true,
    paramsSchema: z.object({
        path: z.string().startsWith("/"),
        method: z.enum(HTTP_METHODS),
        src: z.string(),
        routeName: z.string().optional()
    }),
    render: () => {
        throw new Error(`"Api.Route" requires the "@webiny/project-aws" package.`);
    }
});
