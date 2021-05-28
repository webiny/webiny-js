import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<string> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-contains",
    operation: "contains",
    matches: ({ fieldValue, compareValue }) => {
        const re = new RegExp(compareValue, "i");
        return fieldValue.match(re) !== null;
    }
});
