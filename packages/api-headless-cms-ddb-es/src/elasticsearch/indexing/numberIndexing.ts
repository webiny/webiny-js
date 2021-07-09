import { CmsModelFieldToElasticsearchPlugin } from "../../types";

const convertToString = (value: number[] | number) => {
    if (Array.isArray(value) === false) {
        return value;
    }
    return (value as number[]).map(String);
};

const convertToFloat = (value: string[] | number) => {
    if (Array.isArray(value) === false) {
        return typeof value === "string" ? parseFloat(value) : value;
    }
    return (value as string[]).map(v => parseFloat(v));
};

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-number",
    fieldType: "number",
    unmappedType: () => {
        return "float";
    },
    toIndex({ fieldPath, getValue }) {
        const value = getValue(fieldPath);
        return {
            values: {
                [fieldPath]: convertToString(value)
            }
        };
    },
    fromIndex({ fieldPath, getValue }) {
        const value = getValue(fieldPath);
        return {
            values: {
                [fieldPath]: convertToFloat(value)
            }
        };
    }
});
