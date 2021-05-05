import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<string> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-not-eq",
    operation: "not_eq",
    matches: ({ inputValue, compareValue }) => {
        return inputValue !== compareValue;
    }
});
