import gql from "graphql-tag";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { i18nFieldInput } from "./../graphqlTypes/i18nFieldInput";
import { createTypeName } from "../utils/createTypeName";

const createRefTypeName = (host, target) => {
    return `${host}To${target}`;
};

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-ref",
    type: "cms-model-field-to-graphql",
    fieldType: "ref",
    read: {
        createTypeField({ field }) {
            const localeArg = "(locale: String)";
            if (field.multipleValues) {
                return `${field.fieldId}${localeArg}: [ID]`;
            }
            return `${field.fieldId}${localeArg}: ID`;
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
            const fieldTypeName = createTypeName(model.modelId);
            const mTypeName = createTypeName(field.settings.modelId);
            const name = `${"CmsRef" + createRefTypeName(fieldTypeName, mTypeName)}`;

            return {
                fields:
                    field.fieldId +
                    ": CmsRef" +
                    createRefTypeName(fieldTypeName, mTypeName) +
                    "List",
                typeDefs: `
                    type ${name}ListLocalized {
                        value: [${mTypeName}]
                        locale: ID!
                    }

                    type ${name}List {
                        value(locale: String): [${mTypeName}]
                        values: [${name}ListLocalized]!
                    }
                `
            };

        },
        createInputField({ field }) {
            return field.fieldId + ": CmsRefListInput";
        }
    }
};

export default plugin;
