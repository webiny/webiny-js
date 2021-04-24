import { CmsContext, CmsModelFieldToGraphQLPlugin } from "../../../types";
import { createReadTypeName } from "../utils/createTypeName";

const createUnionTypeName = (model, field) => {
    return `${createReadTypeName(model.modelId)}${createReadTypeName(field.fieldId)}`;
};

const createListFilters = ({ field }) => {
    return `
        ${field.fieldId}: String
        ${field.fieldId}_in: [String!]
        ${field.fieldId}_not: String
        ${field.fieldId}_not_in: [String!]
    `;
};

const typeNameToModelId = new Map();

const plugin: CmsModelFieldToGraphQLPlugin = {
    name: "cms-model-field-to-graphql-ref",
    type: "cms-model-field-to-graphql",
    fieldType: "ref",
    isSortable: false,
    isSearchable: true,
    read: {
        createTypeField({ model, field }) {
            const gqlType =
                field.settings.models.length > 1
                    ? createUnionTypeName(model, field)
                    : createReadTypeName(field.settings.models[0].modelId);

            return field.fieldId + `: ${field.multipleValues ? `[${gqlType}]` : gqlType}`;
        },
        createResolver({ field }) {
            // Create a map of model types and corresponding modelIds so resolvers don't need to perform the lookup.
            for (const item of field.settings.models) {
                typeNameToModelId.set(createReadTypeName(item.modelId), item.modelId);
            }

            return async (instance, args, { cms }: CmsContext, info) => {
                const modelId = typeNameToModelId.get(info.returnType.toString());

                if (!modelId) {
                    return null;
                }

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
        },
        createSchema({ models }) {
            const unionFields = [];
            for (const model of models) {
                // Generate a dedicated union type for every `ref` field which has more than 1 content model assigned.
                model.fields
                    .filter(field => field.type === "ref" && field.settings.models.length > 1)
                    .forEach(field => unionFields.push({ model, field }));
            }

            if (!unionFields.length) {
                return null;
            }

            return {
                typeDefs: unionFields
                    .map(
                        ({ model, field }) =>
                            `union ${createUnionTypeName(
                                model,
                                field
                            )} = ${field.settings.models
                                .map(({ modelId }) => createReadTypeName(modelId))
                                .join(" | ")}`
                    )
                    .join("\n"),
                resolvers: {}
            };
        },
        createListFilters
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
        },
        createListFilters
    }
};

export default plugin;
