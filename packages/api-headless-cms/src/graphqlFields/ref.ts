import WebinyError from "@webiny/error";
import {
    CmsContext,
    CmsEntry,
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { createTypeName } from "~/utils/createTypeName";
import { parseIdentifier } from "@webiny/utils";
import { createGraphQLInputField } from "./helpers";

interface RefFieldValue {
    /**
     * `id` is optional for backwards compatibility with records created before this property was introduced.
     */
    id?: string;
    entryId: string;
    modelId: string;
}

const createUnionTypeName = (model: CmsModel, field: CmsModelField) => {
    return `${model.singularApiName}_${createTypeName(field.fieldId)}`;
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

interface GetModelParams {
    models: CmsModel[];
    modelId: string;
}

const getModel = (params: GetModelParams): CmsModel => {
    const { models, modelId } = params;

    const model = models.find(item => item.modelId === modelId);
    if (model) {
        return model;
    }
    throw new WebinyError(
        `Could not find model with ID "${modelId}" in the list of models.`,
        "MODEL_NOT_FOUND",
        {
            modelId
        }
    );
};

const getModelSingularApiName = (params: GetModelParams): string => {
    const model = getModel(params);

    return model.singularApiName;
};

export const createRefField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-ref",
        type: "cms-model-field-to-graphql",
        fieldType: "ref",
        isSortable: false,
        isSearchable: true,
        read: {
            createTypeField({ model, field, models }) {
                const fieldModels = field.settings?.models || [];
                const gqlType =
                    fieldModels.length > 1
                        ? createUnionTypeName(model, field)
                        : getModelSingularApiName({ models, modelId: fieldModels[0].modelId });
                const typeDefs =
                    fieldModels.length > 1
                        ? `union ${gqlType} = ${getFieldModels(field)
                              .map(({ modelId }) =>
                                  getModelSingularApiName({
                                      models,
                                      modelId
                                  })
                              )
                              .join(" | ")}`
                        : "";

                return {
                    fields:
                        field.fieldId +
                        `(populate: Boolean = true): ${
                            field.multipleValues ? `[${gqlType}!]` : gqlType
                        }`,
                    typeDefs
                };
            },
            /**
             * TS is complaining about mixed types for createResolver.
             * TODO @ts-refactor @pavel Maybe we should have a single createResolver method?
             */
            // @ts-expect-error
            createResolver({ field, models }) {
                // Create a map of model types and corresponding modelIds so resolvers don't need to perform the lookup.
                const fieldModels = field.settings?.models || [];
                for (const item of fieldModels) {
                    modelIdToTypeName.set(
                        item.modelId,
                        getModelSingularApiName({
                            models,
                            modelId: item.modelId
                        })
                    );
                }

                return async (parent, args, context: CmsContext) => {
                    const { cms } = context;

                    // Get field value for this entry
                    const initialValue = parent[field.fieldId] as RefFieldValue | RefFieldValue[];

                    if (!initialValue) {
                        return null;
                    }
                    if (args.populate === false) {
                        return initialValue;
                    }

                    if (field.multipleValues) {
                        /**
                         * We cast because value really can be array and single value.
                         * At this point, we are 99% sure that it is an array (+ we check for it)
                         */
                        const referenceFieldValues = initialValue as RefFieldValue[];
                        if (
                            Array.isArray(referenceFieldValues) === false ||
                            referenceFieldValues.length === 0
                        ) {
                            return [];
                        }

                        const entriesByModel = referenceFieldValues.reduce((collection, ref) => {
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
                            const model = await cms.getEntryManager(modelId);

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

                        const references = await Promise.all(getters).then(
                            (results: CmsEntry[][]) => {
                                return results.reduce((result, item) => {
                                    return result.concat(item);
                                }, []);
                            }
                        );
                        /**
                         * We need to return the referenced entries in the same order they are in the ref field.
                         * Maybe implement user defined sorting in the future?
                         */
                        return referenceFieldValues
                            .map(v => {
                                return references.find(ref => ref.entryId === v.entryId);
                            })
                            .filter(Boolean);
                    }

                    const value = initialValue as RefFieldValue;

                    // Get model manager, to get access to CRUD methods
                    const model = await cms.getEntryManager(value.modelId);

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
            createSchema() {
                return {
                    typeDefs: createFilteringTypeDef(),
                    resolvers: {}
                };
            },
            createListFilters
        },
        manage: {
            createSchema() {
                /**
                 * `entryId` in `RefFieldInput` is deprecated, but we cannot mark it as such in GraphQL.
                 * `entryId` is extracted at runtime from the `id` which contains both the `entryId` and revision number.
                 * See: `packages/api-headless-cms/src/crud/contentEntry/referenceFieldsMapping.ts`
                 */
                return {
                    typeDefs: /* GraphQL */ `
                        type RefField {
                            modelId: String!
                            entryId: ID!
                            id: ID!
                        }

                        input RefFieldInput {
                            modelId: String!
                            id: RevisionId!
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
