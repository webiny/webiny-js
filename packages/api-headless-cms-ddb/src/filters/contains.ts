import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<string> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-contains",
    operation: "contains",
    matches: ({ fieldValue, compareValue }) => {
        return fieldValue.match(compareValue) !== null;
    }
});
