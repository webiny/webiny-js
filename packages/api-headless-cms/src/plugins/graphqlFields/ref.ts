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
            const { modelId, type } = field.settings;
            const many = type === "many";
            const gqlType = createReadTypeName(modelId);
            const fieldArgs = many ? createListArgs({ model, field }) : "";

            return field.fieldId + fieldArgs + `: ${many ? `${gqlType}ListResponse` : gqlType}`;
        },
        createResolver({ field }) {
            return (instance, args) => {
                return instance[field.fieldId].value(args.locale);
            };
        },
    },
    manage: {
        createResolver({ field }) {
            return instance => {
                return instance[field.fieldId];
            };
        },
        createTypes() {
            return /* GraphQL */ `
                type CmsManageRefOne {
                    locale: String
                    value: ID
                }

                input CmsManageRefOneInput {
                    locale: String!
                    value: ID!
                }

                type CmsManageRefMany {
                    locale: String
                    value: [ID]
                }

                input CmsManageRefManyInput {
                    locale: String!
                    value: [ID!]
                }
            `;
        },
        createTypeField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId + `: ${type === "many" ? `[CmsManageRefMany]` : `[CmsManageRefOne]`}`
            );
        },
        createInputField({ field }) {
            const { type } = field.settings;

            return (
                field.fieldId +
                `: ${type === "many" ? "[CmsManageRefManyInput]" : "[CmsManageRefOneInput]"}`
            );
        }
    }
};

export default plugin;
