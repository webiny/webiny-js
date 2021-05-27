import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<string> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-eq",
    operation: "eq",
    matches: ({ fieldValue, compareValue }) => {
        return fieldValue === compareValue;
    }
});
