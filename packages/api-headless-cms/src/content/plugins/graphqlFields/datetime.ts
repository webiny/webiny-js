import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "~/content/plugins/graphqlFields/requiredField";

const fieldGraphQLTypes = {
    time: "Time",
    dateTimeWithoutTimezone: "DateTime",
    dateTimeWithTimezone: "DateTimeZ",
    date: "Date"
};

const getFieldGraphQLType = (field: CmsModelField): string => {
    const type = field.settings.type;
    if (!type || !fieldGraphQLTypes[type]) {
        return "DateTime";
    }
    return fieldGraphQLTypes[type];
};

const createListFilters = ({ field }) => {
    return `
        ${field.alias}: ${getFieldGraphQLType(field)}
        ${field.alias}_not: ${getFieldGraphQLType(field)}
        ${field.alias}_in: [${getFieldGraphQLType(field)}]
        ${field.alias}_not_in: [${getFieldGraphQLType(field)}]
        ${field.alias}_lt: ${getFieldGraphQLType(field)}
        ${field.alias}_lte: ${getFieldGraphQLType(field)}
        ${field.alias}_gt: ${getFieldGraphQLType(field)}
        ${field.alias}_gte: ${getFieldGraphQLType(field)}
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-datetime",
    type: "cms-model-field-to-graphql",
    fieldType: "datetime",
    isSortable: true,
    isSearchable: true,
    read: {
        createListFilters,
        createGetFilters({ field }) {
            return `${field.alias}: ${getFieldGraphQLType(field)}`;
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.alias}: [${getFieldGraphQLType(field)}]`;
            }

            return `${field.alias}: ${getFieldGraphQLType(field)}`;
        }
    },
    manage: {
        createListFilters,
        createTypeField({ field }) {
            return `${field.alias}: ${getFieldGraphQLType(field)}`;
        },
        createInputField({ field }) {
            return attachRequiredFieldValue(`${field.alias}: ${getFieldGraphQLType(field)}`, field);
        }
    }
};

export default plugin;
