import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { listGlobalComponentsSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbGlobalComponent } from "./websiteBuilderTypes.js";

export interface ListGlobalComponentsParams {
    /** A language code, or "default" (the same as leaving it out). */
    language?: string;
    /** `true`: a global without a record in `language` comes in the site's default language, or else its "default" record. */
    fallback?: boolean;
}

export const listGlobalComponents = createMethod(
    listGlobalComponentsSchema,
    async (config, fetchFn, params) => {
        const { language, fallback } = (params ?? {}) as ListGlobalComponentsParams;
        const result = await executeWbOperation<WbGlobalComponent[]>(config, fetchFn, {
            type: "query",
            operation: "listGlobalComponents",
            variableDefinitions: "$language: String, $fallback: Boolean",
            args: "language: $language, fallback: $fallback",
            selection: `
                        name
                        language
                        elements
                        bindings`,
            variables: { language, fallback }
        });
        return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data ?? []);
    }
);
