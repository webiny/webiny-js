import { createImplementation } from "@webiny/di";
import {
    ListAppLambdaFunctionsService,
    PulumiGetStackExportService,
    LoggerService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import path from "path";
import minimatch from "minimatch";

interface ExpectedStackExport {
    deployment: {
        resources: Array<{
            type: string;
            inputs: {
                name: string;
                code: {
                    assets: Record<string, { path: string }>;
                };
            };
        }>;
    };
}

export class DefaultListAppLambdaFunctionsService
    implements ListAppLambdaFunctionsService.Interface
{
    constructor(
        private pulumiGetStackExportService: PulumiGetStackExportService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(app: AppModel, params?: ListAppLambdaFunctionsService.Params) {
        const stackExport =
            await this.pulumiGetStackExportService.execute<ExpectedStackExport>(app);

        if (!stackExport) {
            // If no stack export is found, return an empty array. This is a valid scenario.
            // For example, watching the Admin app locally, but not deploying it.
            return {
                list: [],
                meta: {
                    count: 0,
                    totalCount: 0
                }
            };
        }

        // If an app is not deployed, resources will not exist.
        const resources = stackExport.deployment?.resources ?? [];

        const allFunctionsList = resources
            .filter(r => r.type === "aws:lambda/function:Function")
            // We don't need to watch the authorizer function.
            .filter(resource => {
                const isAuthorizerFunction = resource.inputs.name.includes(
                    "watch-command-iot-authorizer"
                );
                return !isAuthorizerFunction;
            });

        let filteredFunctionsList = allFunctionsList
            // First, this filter ensures that Lambda@Edge functions are excluded. Second,
            // it also ensures a function is filtered out if a `pulumi refresh` was called.
            // This is because, when called, the paths in Pulumi state file disappear, and
            // we can't determine the path to the handler. Probably needs revisiting. 🤦‍♂️
            .filter(resource => {
                return "." in resource.inputs.code.assets;
            })
            .map(resource => {
                const fnName = resource.inputs.name;
                const handlerBuildFolderPath = resource.inputs.code.assets["."].path;

                // Atm, functions are always built into a `handler.js` file.
                // At some point, this should become `handler.js` and be fully ESM.
                const handlerPath = path.join(handlerBuildFolderPath, "handler.js");
                return {
                    name: fnName,
                    path: handlerPath
                };
            });

        if (params?.whitelist?.length) {
            const functionNamesToMatch = Array.isArray(params.whitelist)
                ? params.whitelist
                : [params.whitelist];

            // `functionNamesToWatch` is an array of glob patterns, which denote which functions to watch.
            filteredFunctionsList = filteredFunctionsList.filter(fn => {
                return functionNamesToMatch.some(pattern => {
                    if (pattern.includes("*")) {
                        return minimatch(fn.name, pattern);
                    }

                    return fn.name.includes(pattern);
                });
            });
        } else {
            // We've hardcoded this filtering here just because of lack of time.
            // With v5, these "presets" were located within `webiny.application.ts` files.
            if (app.name === "api") {
                filteredFunctionsList = filteredFunctionsList.filter(fn => {
                    return fn.name.includes("graphql");
                });
            }
        }

        return {
            list: filteredFunctionsList,
            meta: { count: filteredFunctionsList.length, totalCount: allFunctionsList.length }
        };
    }
}

export const listAppLambdaFunctionsService = createImplementation({
    abstraction: ListAppLambdaFunctionsService,
    implementation: DefaultListAppLambdaFunctionsService,
    dependencies: [PulumiGetStackExportService, LoggerService]
});
