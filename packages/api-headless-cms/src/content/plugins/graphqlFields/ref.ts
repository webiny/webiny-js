import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { createReadTypeName } from "../utils/createTypeName";
import { createListArgs } from "../utils/createListArgs";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-ref",
    type: "cms-model-field-to-graphql",
    fieldType: "ref",
    read: {
        createTypeField({ model, field }) {
            const localeArg = "(locale: String)";
            const { modelId, type } = field.settings;
            const many = type === "many";
            const gqlType = createReadTypeName(modelId);
            const fieldArgs = many ? createListArgs({ model, field }) : localeArg;

            return field.fieldId + fieldArgs + `: ${many ? `${gqlType}ListResponse` : gqlType}`;
        },
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
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
                    # ref:one
                    type CmsRefOneLocalized {
                        locale: ID
                        value: ID
                    }

                    type CmsRefOne {
                        values: [CmsRefOneLocalized]
                    }

                    input CmsRefOneLocalizedInput {
                        locale: ID!
                        value: ID!
                    }

                    input CmsRefOneInput {
                        values: [CmsRefOneLocalizedInput]
                    }

                    # ref:many
                    type CmsRefManyLocalized {
                        locale: ID
                        value: [ID]
                    }

                    type CmsRefMany {
                        values: [CmsRefManyLocalized]
                    }

                    input CmsRefManyLocalizedInput {
                        locale: ID!
                        value: [ID]!
                    }

                    input CmsRefManyInput {
                        values: [CmsRefManyLocalizedInput]!
                    }
                `
            };
        },
        createTypeField({ field }) {
            const { type } = field.settings;

            return field.fieldId + `: ${type === "many" ? `CmsRefMany` : `CmsRefOne`}`;
        },
        createInputField({ field }) {
            const { type } = field.settings;

            return field.fieldId + `: ${type === "many" ? "CmsRefManyInput" : "CmsRefOneInput"}`;
        }
    }
};

export default plugin;
