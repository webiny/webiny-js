import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { createReadTypeName } from "../utils/createTypeName";
import { createListArgs } from "../utils/createListArgs";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-ref",
    type: "cms-model-field-to-graphql",
    fieldType: "ref",
    isSortable: false,
    read: {
        createTypeField({ model, field }) {
            const localeArg = field.localization ? "(locale: String)" : "";
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
                    type CmsManageRefOneLocalized {
                        locale: ID
                        value: ID
                    }

                    type CmsManageRefOne {
                        values: [CmsManageRefOneLocalized]
                    }

                    input CmsManageRefOneLocalizedInput {
                        locale: ID!
                        value: ID!
                    }

                    input CmsManageRefOneInput {
                        values: [CmsManageRefOneLocalizedInput]
                    }

                    # ref:many
                    type CmsManageRefManyLocalized {
                        locale: ID
                        value: [ID]
                    }

                    type CmsManageRefMany {
                        values: [CmsManageRefManyLocalized]
                    }

                    input CmsManageRefManyLocalizedInput {
                        locale: ID!
                        value: [ID]!
                    }

                    input CmsManageRefManyInput {
                        values: [CmsManageRefManyLocalizedInput]!
                    }
                `
            };
        },
        createTypeField({ field }) {
            const { type } = field.settings;

            return field.fieldId + `: ${type === "many" ? `CmsManageRefMany` : `CmsManageRefOne`}`;
        },
        createInputField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId +
                `: ${type === "many" ? "CmsManageRefManyInput" : "CmsManageRefOneInput"}`
            );
        }
    }
};

export default plugin;
