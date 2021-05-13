import { CmsFieldValueFilterPlugin } from "../types";

export default (): CmsFieldValueFilterPlugin<number | Date, number | Date> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-gt",
    operation: "gt",
    matches: ({ fieldValue, compareValue }) => {
        return fieldValue > compareValue;
    }
});
