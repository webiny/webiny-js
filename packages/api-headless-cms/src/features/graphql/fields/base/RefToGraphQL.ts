import WebinyError from "@webiny/error";
import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type {
    CmsContext,
    CmsEntry,
    CmsModel,
    CmsModelField,
    CmsModelFieldType,
    CmsModelFieldDefinition
} from "~/types/index.js";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
import { createTypeName } from "~/utils/createTypeName.js";
import { parseIdentifier } from "@webiny/utils";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";
import { HeadlessCms } from "~/features/shared/abstractions.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { GetPublishedEntriesByIdsUseCase } from "~/features/contentEntry/GetPublishedEntriesByIds/index.js";
import { GetLatestEntriesByIdsUseCase } from "~/features/contentEntry/GetLatestEntriesByIds/index.js";

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

const createListFilters = (fieldId: string): string => {
    return `
        ${fieldId}: RefFieldWhereInput
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
            modelId: String
            modelId_not: String
            modelId_in: [String!]
            modelId_not_in: [String!]
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

const getFieldModels = (field: CmsModelField): Pick<CmsModel, "modelId">[] => {
    if (!field.settings || Array.isArray(field.settings.models) === false) {
        return [];
    }
    return field.settings.models as Pick<CmsModel, "modelId">[];
};

const modelIdToTypeName = new Map<string, string>();

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
        { modelId }
    );
};

const getModelSingularApiName = (params: GetModelParams): string => {
    return getModel(params).singularApiName;
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({
        model,
        field,
        models
    }: CmsModelFieldToGraphQL.TypeFieldParams): CmsModelFieldDefinition {
        const fieldModels = field.settings?.models || [];
        const gqlType =
            fieldModels.length > 1
                ? createUnionTypeName(model, field)
                : getModelSingularApiName({ models, modelId: fieldModels[0].modelId });
        const typeDefs =
            fieldModels.length > 1
                ? `union ${gqlType} = ${getFieldModels(field)
                      .map(({ modelId }) => getModelSingularApiName({ models, modelId }))
                      .join(" | ")}`
                : "";

        return {
            fields:
                field.fieldId +
                `(populate: Boolean = true): ${field.list ? `[${gqlType}!]` : gqlType}`,
            typeDefs
        };
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createListFilters(field.fieldId);
    }

    public createResolver({
        field,
        models
    }: CmsModelFieldToGraphQL.ResolverParams): CmsModelFieldToGraphQL.Resolver {
        const fieldModels = field.settings?.models || [];
        for (const item of fieldModels) {
            modelIdToTypeName.set(
                item.modelId,
                getModelSingularApiName({ models, modelId: item.modelId })
            );
        }

        const getValue = (parent: any): RefFieldValue | RefFieldValue[] => {
            if (parent.values) {
                return parent.values[field.fieldId];
            }
            return parent[field.fieldId];
        };

        /* @ts-expect-error Mixed return types for createResolver. */
        return async (parent: CmsEntry, args: any, context: CmsContext) => {
            const { container } = context;
            const cms = container.resolve(HeadlessCms);

            const getModel = container.resolve(GetModelUseCase);
            const getPublishedByIds = container.resolve(GetPublishedEntriesByIdsUseCase);
            const getLatestByIds = container.resolve(GetLatestEntriesByIdsUseCase);

            const initialValue = getValue(parent);

            if (!initialValue) {
                return null;
            }
            if (args.populate === false) {
                return initialValue;
            }

            if (field.list) {
                const referenceFieldValues = initialValue as RefFieldValue[];
                if (
                    Array.isArray(referenceFieldValues) === false ||
                    referenceFieldValues.length === 0
                ) {
                    return [];
                }

                const entriesByModel = referenceFieldValues.reduce(
                    (collection, ref) => {
                        if (!collection[ref.modelId]) {
                            collection[ref.modelId] = [];
                        } else if (collection[ref.modelId].includes(ref.entryId) === true) {
                            return collection;
                        }
                        collection[ref.modelId].push(ref.entryId);
                        return collection;
                    },
                    {} as Record<string, string[]>
                );

                const getters = Object.keys(entriesByModel).map(async modelId => {
                    const idList = entriesByModel[modelId];
                    const modelResult = await getModel.execute(modelId);
                    const model = modelResult.value;

                    let entries: CmsEntry[];
                    if (cms.READ) {
                        const getPublishedResult = await getPublishedByIds.execute(model, idList);
                        entries = getPublishedResult.value;
                    } else {
                        const latestByIsResult = await getLatestByIds.execute(model, idList);
                        entries = latestByIsResult.value;
                    }
                    return appendTypename(entries, modelIdToTypeName.get(modelId)!);
                });

                const references = await Promise.all(getters).then((results: CmsEntry[][]) => {
                    return results.reduce((result, item) => {
                        return result.concat(item);
                    }, []);
                });

                return referenceFieldValues
                    .map(v => {
                        return references.find(ref => ref.entryId === v.entryId);
                    })
                    .filter(Boolean);
            }

            const value = initialValue as RefFieldValue;
            const modelResult = await getModel.execute(value.modelId);
            const model = modelResult.value;

            let revisions: CmsEntry[];
            if (cms.READ) {
                const publishedByIdsResult = await getPublishedByIds.execute(model, [
                    value.entryId
                ]);
                revisions = publishedByIdsResult.value;
            } else {
                const latestByIdsResult = await getLatestByIds.execute(model, [value.entryId]);
                revisions = latestByIdsResult.value;
            }

            if (!revisions || revisions.length === 0) {
                return null;
            }
            return {
                ...revisions[0],
                __typename: modelIdToTypeName.get(value.modelId)
            };
        };
    }

    public createSchema(): GraphQLSchemaDefinition<CmsContext> {
        return {
            typeDefs: createFilteringTypeDef(),
            resolvers: {}
        };
    }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [RefField!]`;
        }
        return `${field.fieldId}: RefField`;
    }

    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "RefFieldInput");
    }

    public createListFilters({ field }: CmsModelFieldToGraphQL.ListFiltersParams): string {
        return createListFilters(field.fieldId);
    }

    public createSchema(): GraphQLSchemaDefinition<CmsContext> {
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
    }
}

class RefToGraphQL implements CmsModelFieldToGraphQL.Interface {
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "ref";
    public readonly isSearchable: boolean = true;
    public readonly isSortable: boolean = false;
    public readonly isFullTextSearchable: boolean = false;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const RefFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: RefToGraphQL,
    dependencies: []
});
