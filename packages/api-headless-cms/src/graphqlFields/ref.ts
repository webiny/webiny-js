import {
    CmsEntry,
    CmsContext,
    CmsModelFieldToGraphQLPlugin,
    CmsModel,
    CmsModelField
} from "~/types";
import { createReadTypeName } from "~/utils/createTypeName";
import { parseIdentifier } from "@webiny/utils";
import { createGraphQLInputField } from "./helpers";

interface RefFieldValue {
    id?: string;
    entryId: string;
    modelId: string;
}

interface UnionField {
    model: CmsModel;
    field: CmsModelField;
    typeName: string;
}

const createUnionTypeName = (model: CmsModel, field: CmsModelField) => {
    return `${createReadTypeName(model.modelId)}${createReadTypeName(field.fieldId)}`;
};

interface CreateListFilterParams {
    field: CmsModelField;
}
const createListFilters = ({ field }: CreateListFilterParams) => {
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
/**
 * We cast settings.models as object to have modelId because internally we know that it is so.
 * Internal stuff so we are sure that settings.models contains what we require.
 */
const getFieldModels = (field: CmsModelField): Pick<CmsModel, "modelId">[] => {
    if (!field.settings || Array.isArray(field.settings.models) === false) {
        return [];
    }
    return field.settings.models as Pick<CmsModel, "modelId">[];
};

const modelIdToTypeName = new Map();

export const createRefField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-ref",
        type: "cms-model-field-to-graphql",
        fieldType: "ref",
        isSortable: false,
        isSearchable: true,
        read: {
            createTypeField({ model, field }) {
                const models = field.settings?.models || [];
                const gqlType =
                    models.length > 1
                        ? createUnionTypeName(model, field)
                        : createReadTypeName(models[0].modelId);

                return field.fieldId + `: ${field.multipleValues ? `[${gqlType}]` : gqlType}`;
            },
            /**
             * TS is complaining about mixed types for createResolver.
             * TODO @ts-refactor @pavel Maybe we should have a single createResolver method?
             */
            // @ts-ignore
            createResolver(params) {
                const { field } = params;
                // Create a map of model types and corresponding modelIds so resolvers don't need to perform the lookup.
                const models = field.settings?.models || [];
                for (const item of models) {
                    modelIdToTypeName.set(item.modelId, createReadTypeName(item.modelId));
                }

                return async (parent, _, context: CmsContext) => {
                    const { cms } = context;

                    // Get field value for this entry
                    const initialValue = parent[field.fieldId] as RefFieldValue | RefFieldValue[];

                    if (!initialValue) {
                        return null;
                    }

                    if (field.multipleValues) {
                        /**
                         * We cast because value really can be array and single value.
                         * At this point, we are 99% sure that it is an array (+ we check for it)
                         */
                        const value = initialValue as RefFieldValue[];
                        if (Array.isArray(value) === false || value.length === 0) {
                            return [];
                        }

                        const entriesByModel = value.reduce((collection, ref) => {
                            if (!collection[ref.modelId]) {
                                collection[ref.modelId] = [];
                            } else if (collection[ref.modelId].includes(ref.entryId) === true) {
                                return collection;
                            }

                            collection[ref.modelId].push(ref.entryId);

                            return collection;
                        }, {} as Record<string, string[]>);

                        const getters = Object.keys(entriesByModel).map(async modelId => {
                            const idList = entriesByModel[modelId];
                            // Get model manager, to get access to CRUD methods
                            const model = await cms.getModelManager(modelId);

                            let entries: CmsEntry[];
                            // `read` API works with `published` data
                            if (cms.READ) {
                                entries = await model.getPublishedByIds(idList);
                            }
                            // `preview` and `manage` with `latest` data
                            else {
                                entries = await model.getLatestByIds(idList);
                            }

                            return appendTypename(entries, modelIdToTypeName.get(modelId));
                        });

                        return await Promise.all(getters).then((results: any[]) =>
                            results.reduce((result, item) => result.concat(item), [])
                        );
                    }

                    const value = initialValue as RefFieldValue;

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
                    return {
                        ...revisions[0],
                        __typename: modelIdToTypeName.get(value.modelId)
                    };
                };
            },
            createSchema({ models }) {
                const unionFields: UnionField[] = [];
                for (const model of models) {
                    // Generate a dedicated union type for every `ref` field which has more than 1 content model assigned.
                    model.fields
                        .filter(
                            field =>
                                field.type === "ref" && (field.settings?.models || []).length > 1
                        )
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
                            `union ${typeName} = ${getFieldModels(field)
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
                        id: ID!
                    }
                    
                    ${createFilteringTypeDef()}
                `,
                    resolvers: {
                        RefField: {
                            entryId: (parent: RefFieldValue) => {
                                const { id } = parseIdentifier(parent.entryId || parent.id);
                                return id;
                            },
                            id: (parent: RefFieldValue) => {
                                return parent.id || parent.entryId;
                            }
                        }
                    }
                };
            },
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}: [RefField!]`;
                }
                return `${field.fieldId}: RefField`;
            },
            createInputField({ field }) {
                return createGraphQLInputField(field, "RefFieldInput");
            },
            createListFilters
        }
    };
};
