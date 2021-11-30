import { CmsEntry, CmsContext, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createReadTypeName } from "~/content/plugins/utils/createTypeName";

const createUnionTypeName = (model, field) => {
    return `${createReadTypeName(model.modelId)}${createReadTypeName(field.fieldId)}`;
};

const createListFilters = ({ field }) => {
    return `
        ${field.fieldId}: RefFieldWhereInput
    `;
};

const createFilteringTypeDef = () => {
    return `
        input RefFieldWhereInput {
            id: String
            id_not: String
            id_in: [String!]
            id_not_in: [String]
            entryId: String
            entryId_not: String
            entryId_in: [String!]
            entryId_not_in: [String!]
        }
    `;
};

const appendTypename = (entries: CmsEntry[], typename: string): CmsEntry[] => {
    return entries.map(item => {
        return {
            ...item,
            __typename: typename
        };
    });
};

const modelIdToTypeName = new Map();

interface EntryByModel {
    entryId: string;
    modelId: string;
}

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
                modelIdToTypeName.set(item.modelId, createReadTypeName(item.modelId));
            }

            return async (parent, _, context: CmsContext) => {
                const { cms } = context;

                // Get field value for this entry
                const value = parent[field.fieldId];

                if (!value) {
                    return null;
                }

                if (field.multipleValues) {
                    if (!value.length) {
                        return [];
                    }

                    const entriesByModel: EntryByModel[] = value.map((ref, index) => {
                        return {
                            entryId: ref.entryId,
                            modelId: ref.modelId,
                            index
                        };
                    });
                    const getters = entriesByModel.map(async ({ modelId, entryId }) => {
                        // Get model manager, to get access to CRUD methods
                        const model = await cms.getModelManager(modelId);

                        let entries: CmsEntry[];
                        // `read` API works with `published` data
                        if (cms.READ) {
                            entries = await model.getPublishedByIds([entryId]);
                        }
                        // `preview` and `manage` with `latest` data
                        else {
                            entries = await model.getLatestByIds([entryId]);
                        }

                        return appendTypename(entries, modelIdToTypeName.get(modelId));
                    });

                    return await Promise.all(getters).then((results: any[]) =>
                        results.reduce((result, item) => result.concat(item), [])
                    );
                }

                // Get model manager, to get access to CRUD methods
                const model = await cms.getModelManager(value.modelId);

                let revisions: CmsEntry[];
                // `read` API works with `published` data
                if (cms.READ) {
                    revisions = await model.getPublishedByIds([value.entryId]);
                }
                // `preview` API works with `latest` data
                else {
                    revisions = await model.getLatestByIds([value.entryId]);
                }

                /**
                 * If there are no revisions we must return null.
                 */
                if (!revisions || revisions.length === 0) {
                    return null;
                }
                return { ...revisions[0], __typename: modelIdToTypeName.get(value.modelId) };
            };
        },
        createSchema({ models }) {
            const unionFields = [];
            for (const model of models) {
                // Generate a dedicated union type for every `ref` field which has more than 1 content model assigned.
                model.fields
                    .filter(field => field.type === "ref" && field.settings.models.length > 1)
                    .forEach(field =>
                        unionFields.push({
                            model,
                            field,
                            typeName: createUnionTypeName(model, field)
                        })
                    );
            }
            const unionFieldsTypeDef = unionFields
                .map(
                    ({ field, typeName }) =>
                        `union ${typeName} = ${field.settings.models
                            .map(({ modelId }) => createReadTypeName(modelId))
                            .join(" | ")}`
                )
                .join("\n");

            const filteringTypeDef = `
                ${createFilteringTypeDef()}
                
                ${unionFieldsTypeDef}
            `;

            return {
                typeDefs: filteringTypeDef,
                resolvers: {}
            };
        },
        createListFilters
    },
    manage: {
        createSchema() {
            /**
             * entryId in RefFieldInput is deprecated but cannot mark it as GraphQL does not allow marking input fields as deprecated
             */
            return {
                typeDefs: `
                    type RefField {
                        modelId: String!
                        entryId: ID!
                        id: ID!
                    }
                    
                    input RefFieldInput {
                        modelId: String!
                        id: ID
                        entryId: ID!
                    }
                    
                    ${createFilteringTypeDef()}
                `,
                resolvers: {}
            };
        },
        createTypeField({ field }) {
            if (field.multipleValues) {
                return `${field.fieldId}: [RefField!]`;
            }

            return `${field.fieldId}: RefField`;
        },
        createInputField({ field }) {
            if (field.multipleValues) {
                return field.fieldId + ": [RefFieldInput!]!";
            }

            return field.fieldId + ": RefFieldInput";
        },
        createListFilters
    }
};

export default plugin;
