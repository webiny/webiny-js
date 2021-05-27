import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<string, string[]> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-in",
    operation: "in",
    matches: ({ fieldValue, compareValue }) => {
        return compareValue.includes(fieldValue);
    }
});
