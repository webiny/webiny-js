import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<number | Date, number | Date> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-not-gt",
    operation: "not_gt",
    matches: ({ inputValue, compareValue }) => {
        return inputValue <= compareValue;
    }
});
