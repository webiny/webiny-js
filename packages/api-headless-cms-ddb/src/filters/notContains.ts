import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<string> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-not-contains",
    operation: "not_contains",
    matches: ({ inputValue, compareValue }) => {
        return inputValue.match(compareValue) === null;
    }
});
