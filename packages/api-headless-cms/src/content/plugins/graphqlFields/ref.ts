import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
// import { createTypeName } from "../utils/createTypeName";
import { createReadTypeName } from "../utils/createTypeName";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-ref",
    type: "cms-model-field-to-graphql",
    fieldType: "ref",
    isSortable: false,
    isSearchable: false,
    read: {
        createTypeField({ field }) {
            const { models } = field.settings;
            // For now we only use the first model in the list. Support for multiple models will come in the future.
            const gqlType = createReadTypeName(models[0].modelId);

            return field.fieldId + `: ${field.multipleValues ? `[${gqlType}]` : gqlType}`;
        },
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        }
    },
    manage: {
        createSchema() {
            return {
                typeDefs: `
                    type RefField {
                        modelId: String!
                        entryId: ID!
                    }
                    
                    input RefFieldInput {
                        modelId: String!
                        entryId: ID!
                    }
                `
            };
        },
        createResolver({ field }) {
            return instance => {
                return instance.values[field.fieldId];
            };
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [RefField]`;
            }

            return `${field.fieldId}: RefField`;
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": [RefFieldInput]";
            }

            return field.fieldId + ": RefFieldInput";
        }
    }
};

export default plugin;
