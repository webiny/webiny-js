import {
    CmsEntry,
    CmsContext,
    CmsModelFieldToGraphQLPlugin,
    CmsModel,
    CmsModelField
} from "~/types";
import { createReadTypeName } from "~/utils/createTypeName";
// import { createGraphQLInputField } from "./helpers";

interface RefFieldValue {
    id: string;
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

const getFieldModels = (field: CmsModelField): string[] => {
    if (!field.settings || !Array.isArray(field.settings.fields)) {
        return [];
    }
    return field.settings.fields.map(field => field.type.split("ref:")[1]);
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

export const createDynamicZoneField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-dynamic-zone",
        type: "cms-model-field-to-graphql",
        fieldType: "dynamic-zone",
        isSortable: false,
        isSearchable: false,
        read: {
            createTypeField({ model, field }) {
                const models = getFieldModels(field);
                const gqlType =
                    models.length > 1
                        ? createUnionTypeName(model, field)
                        : createReadTypeName(models[0]);

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
                const models = getFieldModels(field);
                for (const modelId of models) {
                    modelIdToTypeName.set(modelId, createReadTypeName(modelId));
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
                         * We cast because value really can be an array and single value.
                         * At this point, we are 99% sure that it is an array (+ we check for it)
                         */
                        const value = initialValue as RefFieldValue[];
                        if (!Array.isArray(value) || value.length === 0) {
                            return [];
                        }

                        const entriesByModel = value.reduce((collection, ref) => {
                            if (!collection[ref.modelId]) {
                                collection[ref.modelId] = [];
                            } else if (collection[ref.modelId].includes(ref.id)) {
                                return collection;
                            }

                            collection[ref.modelId].push(ref.id);

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
                    const model = await cms.getEntryManager(value.modelId);

                    let revisions: CmsEntry[];
                    if (cms.READ) {
                        // `read` API works with `published` data
                        revisions = await model.getPublishedByIds([value.id]);
                    } else {
                        // `preview` API works with `latest` data
                        revisions = await model.getLatestByIds([value.id]);
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
                                field.type === "model-group" &&
                                (field.settings?.fields || []).length > 1
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
                                .map(modelId => createReadTypeName(modelId))
                                .join(" | ")}`
                    )
                    .join("\n");

                return {
                    typeDefs: unionFieldsTypeDef,
                    resolvers: {}
                };
            }
        },
        manage: {
            createTypeField({ field }) {
                if (field.multipleValues) {
                    return `${field.fieldId}: [JSON!]`;
                }
                return `${field.fieldId}: JSON`;
            },
            createInputField({ field }) {
                return `${field.fieldId}: JSON`;
            }
        }
    };
};
