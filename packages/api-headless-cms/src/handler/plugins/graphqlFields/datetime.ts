import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

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
    isSortable: false,
    read: {
        createListFilters,
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
        createTypeField({ field }) {
            const localeArg = "(locale: String)";

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
                    # dateTimeWithTimezone types
                    input CmsDateTimeWithTzLocalizedInput {
                        value: String
                        locale: ID!
                    }

                    input CmsDateTimeWithTzInput {
                        values: [CmsDateTimeWithTzLocalizedInput]
                    }

                    type CmsDateTimeWithTzLocalized {
                        value: String
                        locale: ID!
                    }

                    type CmsDateTimeWithTz {
                        value: String
                        values: [CmsDateTimeWithTzLocalized]!
                    }

                    # dateTimeWithoutTimezone types
                    input CmsDateTimeLocalizedInput {
                        value: String
                        locale: ID!
                    }

                    input CmsDateTimeInput {
                        values: [CmsDateTimeLocalizedInput]
                    }

                    type CmsDateTimeLocalized {
                        value: String
                        locale: ID!
                    }

                    type CmsDateTime {
                        value: String
                        values: [CmsDateTimeLocalized]!
                    }

                    # date types
                    input CmsDateLocalizedInput {
                        value: String
                        locale: ID!
                    }

                    input CmsDateInput {
                        values: [CmsDateLocalizedInput]
                    }

                    type CmsDateLocalized {
                        value: String
                        locale: ID!
                    }

                    type CmsDate {
                        value: String
                        values: [CmsDateLocalized]!
                    }

                    # time types
                    input CmsTimeLocalizedInput {
                        value: String
                        locale: ID!
                    }

                    input CmsTimeInput {
                        values: [CmsTimeLocalizedInput]
                    }

                    type CmsTimeLocalized {
                        value: String
                        locale: ID!
                    }

                    type CmsTime {
                        value: String
                        values: [CmsTimeLocalized]!
                    }
                `
            };
        },
        createTypeField({ field }) {
            switch (field.settings.type) {
                case "dateTimeWithTimezone":
                    return field.fieldId + ": CmsDateTimeWithTz";
                case "dateTimeWithoutTimezone":
                    return field.fieldId + ": CmsDateTime";
                case "date":
                    return field.fieldId + ": CmsDate";
                case "time":
                    return field.fieldId + ": CmsTime";
            }
        },
        createInputField({ field }) {
            switch (field.settings.type) {
                case "dateTimeWithTimezone":
                    return field.fieldId + ": CmsDateTimeWithTzInput";
                case "dateTimeWithoutTimezone":
                    return field.fieldId + ": CmsDateTimeInput";
                case "date":
                    return field.fieldId + ": CmsDateInput";
                case "time":
                    return field.fieldId + ": CmsTimeInput";
            }
        }
    }
};

export default plugin;
