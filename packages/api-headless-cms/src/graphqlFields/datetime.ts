import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createGraphQLInputField } from "./helpers";

const fieldGraphQLTypes = {
    time: "Time",
    dateTimeWithoutTimezone: "DateTime",
    dateTimeWithTimezone: "DateTimeZ",
    date: "Date"
};

type FieldGraphQLKeys = keyof typeof fieldGraphQLTypes;

const getFieldGraphQLType = (field: CmsModelField): string => {
    const type = field.settings?.type as FieldGraphQLKeys | undefined;
    if (!type || !fieldGraphQLTypes[type]) {
        return fieldGraphQLTypes.dateTimeWithoutTimezone;
    }
    return fieldGraphQLTypes[type];
};

interface CreateListFiltersParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFiltersParams) => {
    return `
        ${field.fieldId}: ${getFieldGraphQLType(field)}
        ${field.fieldId}_not: ${getFieldGraphQLType(field)}
        ${field.fieldId}_in: [${getFieldGraphQLType(field)}]
        ${field.fieldId}_not_in: [${getFieldGraphQLType(field)}]
        ${field.fieldId}_lt: ${getFieldGraphQLType(field)}
        ${field.fieldId}_lte: ${getFieldGraphQLType(field)}
        ${field.fieldId}_gt: ${getFieldGraphQLType(field)}
        ${field.fieldId}_gte: ${getFieldGraphQLType(field)}
    `;
};

export const createDateTimeField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-datetime",
        type: "cms-model-field-to-graphql",
        fieldType: "datetime",
        isSortable: true,
        isSearchable: true,
        read: {
            createListFilters,
            createGetFilters({ field }) {
                return `${field.fieldId}: ${getFieldGraphQLType(field)}`;
            },
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}: [${getFieldGraphQLType(field)}]`;
                }

                return `${field.fieldId}: ${getFieldGraphQLType(field)}`;
            }
        },
        manage: {
            createListFilters,
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}: [${getFieldGraphQLType(field)}]`;
                }
                return `${field.fieldId}: ${getFieldGraphQLType(field)}`;
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, getFieldGraphQLType(field));
            }
        }
    };
};
