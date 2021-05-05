import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<number | Date, number | Date> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-not-lt",
    operation: "not_lt",
    matches: ({ inputValue, compareValue }) => {
        return inputValue >= compareValue;
    }
});
