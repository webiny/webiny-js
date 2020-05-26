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
    name: "cms-model-field-to-graphql-file",
    type: "cms-model-field-to-graphql",
    fieldType: "file",
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
                    # TODO: Not sure that's how it should be done
                    type File @key(fields: "id") {
                        id: ID
                        key: String
                        name: String
                        size: Int
                        type: String
                        src: String
                        tags: [String]
                        meta: JSON
                        createdOn: DateTime
                    }

                    # single file types
                    input CmsFileSingleLocalizedInput {
                        value: RefInput
                        locale: ID!
                    }

                    input CmsFileSingleInput {
                        values: [CmsFileSingleLocalizedInput]
                    }

                    type CmsFileSingleLocalized {
                        value: File
                        locale: ID!
                    }

                    type CmsFileSingle {
                        value: File
                        values: [CmsFileSingleLocalized]!
                    }

                    # multiple file types
                    input CmsFileMultipleLocalizedInput {
                        value: [RefInput]
                        locale: ID!
                    }

                    input CmsFileMultipleInput {
                        values: [CmsFileMultipleLocalizedInput]
                    }

                    type CmsFileMultipleLocalized {
                        value: [File]
                        locale: ID!
                    }

                    type CmsFileMultiple {
                        value: File
                        values: [CmsFileMultipleLocalized]!
                    }
                `
            };
        },
        createTypeField({ field }) {
            const { type } = field.settings;

            return field.fieldId + `: ${type === "single" ? `CmsFileSingle` : `CmsFileMultiple`}`;
        },
        createInputField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId +
                `: ${type === "single" ? `CmsFileSingleInput` : `CmsFileMultipleInput`}`
            );
        }
    }
};

export default plugin;
