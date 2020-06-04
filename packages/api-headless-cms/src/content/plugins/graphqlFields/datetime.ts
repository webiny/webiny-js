import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldType } from "./../graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";

const createListFilters = ({ field }) => {
    return `
        # Matches if the field is equal to the given value
        ${field.fieldId}: String

        # Matches if the field is not equal to the given value
        ${field.fieldId}_not: String


        # Matches if the field value equal one of the given values
        ${field.fieldId}_in: [String]

        # Matches if the field value does not equal any of the given values
        ${field.fieldId}_not_in: [String]

        # Matches if the field value is strictly smaller than the given value
        ${field.fieldId}_lt: String

        # Matches if the field value is smaller than or equal to the given value
        ${field.fieldId}_lte: String

        # Matches if the field value is strictly greater than the given value
        ${field.fieldId}_gt: String

        # Matches if the field value is greater than or equal to the given value
        ${field.fieldId}_gte: String
    `;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-datetime",
    type: "cms-model-field-to-graphql",
    fieldType: "datetime",
    read: {
        createListFilters,
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            if (field.multipleValues) {
                return `${field.fieldId}${localeArg}: [String]`;
            }

            return `${field.fieldId}${localeArg}: String`;
        }
    },
    manage: {
        createListFilters,
        createResolver({ field }) {
            return instance => {
                return instance[field.fieldId];
            };
        },
        createSchema() {
            return {
                typeDefs: gql`
                    ${i18nFieldType("CmsDateTimeWithTz", "String")}
                    ${i18nFieldInput("CmsDateTimeWithTz", "String")}
                    ${i18nFieldType("CmsDateTime", "String")}
                    ${i18nFieldInput("CmsDateTime", "String")}
                    ${i18nFieldType("CmsDate", "String")}
                    ${i18nFieldInput("CmsDate", "String")}
                    ${i18nFieldType("CmsTime", "String")}
                    ${i18nFieldInput("CmsTime", "String")}
                `
            };
        },
        createTypeField({ field }) {
            switch (field.settings.type) {
                case "dateTimeWithTimezone":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsDateTimeWithTzList";
                    }

                    return field.fieldId + ": CmsDateTimeWithTz";
                case "dateTimeWithoutTimezone":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsDateTimeList";
                    }

                    return field.fieldId + ": CmsDateTime";
                case "date":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsDateList";
                    }

                    return field.fieldId + ": CmsDate";
                case "time":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsTimeList";
                    }

                    return field.fieldId + ": CmsTime";
            }
        },
        createInputField({ field }) {
            switch (field.settings.type) {
                case "dateTimeWithTimezone":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsDateTimeWithTzListInput";
                    }

                    return field.fieldId + ": CmsDateTimeWithTzInput";
                case "dateTimeWithoutTimezone":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsDateTimeListInput";
                    }

                    return field.fieldId + ": CmsDateTimeInput";
                case "date":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsDateListInput";
                    }

                    return field.fieldId + ": CmsDateInput";
                case "time":
                    if (field.multipleValues) {
                        return field.fieldId + ": CmsTimeListInput";
                    }

                    return field.fieldId + ": CmsTimeInput";
            }
        }
    }
};

export default plugin;
