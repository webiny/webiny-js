import {
    CmsContentModelField,
    CmsModelFieldToElasticsearchPlugin
} from "@webiny/api-headless-cms/types";

const convertToDate = (value: string, field: CmsContentModelField) => {
    if (!value) {
        return null;
    }
    const type = field.settings.type;
    if (type === "time") {
        return value;
    } else if (type === "date") {
        const dateValue = new Date(value);
        return dateValue.toISOString().substr(0, 10);
    }
    return new Date(value);
};

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-datetime",
    fieldType: "datetime",
    unmappedType: () => {
        return "date";
    },
    fromIndex({ field, entry }) {
        const value = entry.values[field.fieldId];
        const dateValue = convertToDate(value, field);
        if (!dateValue) {
            return {};
        }
        return {
            values: {
                ...entry.values,
                [field.fieldId]: dateValue
            }
        };
    }
});
