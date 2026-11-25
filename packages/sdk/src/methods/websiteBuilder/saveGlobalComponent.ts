import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { saveGlobalComponentSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbGlobalComponent } from "./websiteBuilderTypes.js";

export interface SaveGlobalComponentParams {
    name: string;
    /** A language code, or "default" (the same as leaving it out). */
    language?: string;
    data: {
        elements: Record<string, any>;
        bindings: Record<string, any>;
    };
}

export const saveGlobalComponent = createMethod(
    saveGlobalComponentSchema,
    async (config, fetchFn, params) => {
        const { name, language, data } = params as SaveGlobalComponentParams;
        const result = await executeWbOperation<WbGlobalComponent>(config, fetchFn, {
            type: "mutation",
            operation: "saveGlobalComponent",
            variableDefinitions:
                "$name: String!, $language: String, $data: WbGlobalComponentInput!",
            args: "name: $name, language: $language, data: $data",
            selection: `
                        name
                        language
                        elements
                        bindings`,
            variables: { name, language, data }
        });
        return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
    }
);
