import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";

const createListFilters = ({ field }) => {
    if (field.settings.type === "dateTimeWithTimezone") {
        return `
            # Matches if the field is equal to the given value
            ${field.fieldId}: DateTime
            
            # Matches if the field is not equal to the given value
            ${field.fieldId}_not: DateTime
    
            
            # Matches if the field value equal one of the given values
            ${field.fieldId}_in: [DateTime]
            
            # Matches if the field value does not equal any of the given values
            ${field.fieldId}_not_in: [DateTime]
            
            # Matches if the field value is strictly smaller than the given value
            ${field.fieldId}_lt: DateTime
            
            # Matches if the field value is smaller than or equal to the given value
            ${field.fieldId}_lte: DateTime
            
            # Matches if the field value is strictly greater than the given value
            ${field.fieldId}_gt: DateTime
            
            # Matches if the field value is greater than or equal to the given value
            ${field.fieldId}_gte: DateTime
        `;
    }

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
    isSortable: true,
    read: {
        createListFilters,
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
        createTypeField({ field }) {
            const { type } = field.settings;
            const localeArg = field.localization ? "(locale: String)" : "";

            if (type === "dateTimeWithTz") {
                return `${field.fieldId}${localeArg}: DateTime`;
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
        createTypes() {
            return /* GraphQL */ `
                # dateTimeWithTimezone types
                input CmsManageDateTimeWithTzLocalizedInput {
                    value: DateTime
                    locale: ID!
                }

                input CmsManageDateTimeWithTzInput {
                    values: [CmsManageDateTimeWithTzLocalizedInput]
                }

                type CmsManageDateTimeWithTzLocalized {
                    value: DateTime
                    locale: ID!
                }

                type CmsManageDateTimeWithTz {
                    value: DateTime
                    values: [CmsManageDateTimeWithTzLocalized]!
                }

                # dateTimeWithoutTimezone types
                input CmsManageDateTimeLocalizedInput {
                    value: String
                    locale: ID!
                }

                input CmsManageDateTimeInput {
                    values: [CmsManageDateTimeLocalizedInput]
                }

                type CmsManageDateTimeLocalized {
                    value: String
                    locale: ID!
                }

                type CmsManageDateTime {
                    value: String
                    values: [CmsManageDateTimeLocalized]!
                }

                # date types
                input CmsManageDateLocalizedInput {
                    value: String
                    locale: ID!
                }

                input CmsManageDateInput {
                    values: [CmsManageDateLocalizedInput]
                }

                type CmsManageDateLocalized {
                    value: String
                    locale: ID!
                }

                type CmsManageDate {
                    value: String
                    values: [CmsManageDateLocalized]!
                }

                # time types
                input CmsManageTimeLocalizedInput {
                    value: String
                    locale: ID!
                }

                input CmsManageTimeInput {
                    values: [CmsManageTimeLocalizedInput]
                }

                type CmsManageTimeLocalized {
                    value: String
                    locale: ID!
                }

                type CmsManageTime {
                    value: String
                    values: [CmsManageTimeLocalized]!
                }
            `;
        },
        createTypeField({ field }) {
            switch (field.settings.type) {
                case "dateTimeWithTimezone":
                    return field.fieldId + ": CmsManageDateTimeWithTz";
                case "dateTimeWithoutTimezone":
                    return field.fieldId + ": CmsManageDateTime";
                case "date":
                    return field.fieldId + ": CmsManageDate";
                case "time":
                    return field.fieldId + ": CmsManageTime";
            }
        },
        createInputField({ field }) {
            switch (field.settings.type) {
                case "dateTimeWithTimezone":
                    return field.fieldId + ": CmsManageDateTimeWithTzInput";
                case "dateTimeWithoutTimezone":
                    return field.fieldId + ": CmsManageDateTimeInput";
                case "date":
                    return field.fieldId + ": CmsManageDateInput";
                case "time":
                    return field.fieldId + ": CmsManageTimeInput";
            }
        }
    }
};

export default plugin;
