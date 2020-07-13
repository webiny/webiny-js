import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldType } from "./../graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-datetime",
    type: "cms-model-field-to-graphql",
    fieldType: "datetime",
    read: {
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
