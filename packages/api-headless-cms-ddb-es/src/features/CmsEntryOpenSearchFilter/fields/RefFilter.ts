import WebinyError from "@webiny/error";
import { CmsEntryOpenSearchFilter } from "../abstractions/CmsEntryOpenSearchFilter.js";
import { parseWhereKey } from "@webiny/api-opensearch";

class RefFilterImpl implements CmsEntryOpenSearchFilter.Interface {
    public readonly fieldType = "ref";

    public exec(params: CmsEntryOpenSearchFilter.ExecParams): void {
        const { applyFiltering, query, field } = params;

        let values = params.value;
        /**
         * We must have an object when querying in the ref field.
         */
        if (typeof values !== "object") {
            throw new WebinyError(
                `When querying by ref field, value of the field must be an object.`,
                "OBJECT_REQUIRED",
                {
                    value: values
                }
            );
        }

        if (values === null || values === undefined) {
            values = {
                entryId: null
            };
        }

        for (const key in values) {
            const { operator } = parseWhereKey(key);
            const value = values[key];
            if (value === undefined) {
                continue;
            }

            applyFiltering({
                query,
                field,
                operator,
                key,
                value
            });
        }
    }
}

export const RefFilter = CmsEntryOpenSearchFilter.createImplementation({
    implementation: RefFilterImpl,
    dependencies: []
});
