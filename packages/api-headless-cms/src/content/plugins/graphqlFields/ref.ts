import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";
import { createTypeName } from "../utils/createTypeName";
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
                    ${i18nFieldInput("CmsRef", "ID")}
                `
            };
        },
        createTypeField({ field, model }) {
            const modelIdType = createTypeName(model.modelId);
            const fieldIdType = createTypeName(field.fieldId);
            const refModelIdType = createTypeName(field.settings.modelId);

            const refPrefix = `CmsRef${modelIdType}${fieldIdType}`;

            if (field.multipleValues) {
                return {
                    fields: `${field.fieldId}: ${refPrefix}List`,
                    typeDefs: `
                        type ${refPrefix}ListLocalized {
                            value: [${refModelIdType}]
                            locale: ID!
                        }
    
                        type ${refPrefix}List {
                            value(locale: String): [${refModelIdType}]
                            values: [${refPrefix}ListLocalized]!
                        }`
                };
            }

            return {
                fields: `${field.fieldId}: ${refPrefix}`,
                typeDefs: `
                        type ${refPrefix}Localized {
                            value: ${refModelIdType}
                            locale: ID!
                        }
    
                        type ${refPrefix} {
                            value(locale: String): ${refModelIdType}
                            values: [${refPrefix}Localized]!
                        }`
            };
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": CmsRefListInput";
            }

            return field.fieldId + ": CmsRefInput";
        }
    }
};

export default plugin;
