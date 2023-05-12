import WebinyError from "@webiny/error";
import { CmsEntryFilterPlugin } from "~/plugins/CmsEntryFilterPlugin";
import { parseWhereKey } from "@webiny/api-elasticsearch";

export const createRefFilterPlugin = () => {
    return new CmsEntryFilterPlugin({
        fieldType: "ref",
        exec: params => {
            const { applyFiltering, value: values, query, field } = params;
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
    });
};
