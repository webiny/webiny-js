import { CmsContext, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { createReadTypeName } from "../utils/createTypeName";

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-ref",
    type: "cms-model-field-to-graphql",
    fieldType: "ref",
    isSortable: false,
    isSearchable: true,
    read: {
        createTypeField({ field }) {
            const { models } = field.settings;
            // For now we only use the first model in the list. Support for multiple models will come in the future.
            const gqlType = createReadTypeName(models[0].modelId);

            return field.fieldId + `: ${field.multipleValues ? `[${gqlType}]` : gqlType}`;
        },
        createResolver({ field }) {
            return async (instance, args, { cms }: CmsContext) => {
                const { modelId } = field.settings.models[0];

                // Get model manager, to get access to CRUD methods
                const model = await cms.getModel(modelId);

                // Get field value for this entry
                const value = instance.values[field.fieldId];

                if (!value) {
                    return null;
                }

                if (field.multipleValues) {
                    const ids = value.map(ref => ref.entryId);

                    if (!ids.length) {
                        return [];
                    }

                    const entries = cms.READ
                        ? // `read` API works with `published` data
                          await model.getPublishedByIds(ids)
                        : // `preview` API works with `latest` data
                          await model.getLatestByIds(ids);
                    return entries.filter(Boolean);
                }

                const revisions = cms.READ
                    ? // `read` API works with `published` data
                      await model.getPublishedByIds([value.entryId])
                    : // `preview` API works with `latest` data
                      await model.getLatestByIds([value.entryId]);

                return revisions[0];
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
                `,
                resolvers: {}
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
