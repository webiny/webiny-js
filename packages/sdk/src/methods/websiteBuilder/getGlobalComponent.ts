import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { getGlobalComponentSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbGlobalComponent } from "./websiteBuilderTypes.js";

export interface GetGlobalComponentParams {
    name: string;
    /** A language code, or "default" (the same as leaving it out). Exact: no fallback. */
    language?: string;
}

export const getGlobalComponent = createMethod(
    getGlobalComponentSchema,
    async (config, fetchFn, params) => {
        const { name, language } = params as GetGlobalComponentParams;
        const result = await executeWbOperation<WbGlobalComponent | null>(config, fetchFn, {
            type: "query",
            operation: "getGlobalComponent",
            variableDefinitions: "$name: String!, $language: String",
            args: "name: $name, language: $language",
            selection: `
                        name
                        language
                        elements
                        bindings`,
            variables: { name, language }
        });
        return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
    }
);
