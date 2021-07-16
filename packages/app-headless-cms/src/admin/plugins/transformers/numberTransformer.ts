import { CmsFieldValueTransformer } from "~/types";

export default (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-number",
    fieldType: "number",
    transform: value => {
        if (Array.isArray(value) === true) {
            return (value as string[]).map(Number);
        }
        return Number(value as string);
    }
});
