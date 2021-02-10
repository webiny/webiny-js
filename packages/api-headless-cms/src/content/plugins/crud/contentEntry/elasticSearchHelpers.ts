import {
    CmsContentEntryListOptions,
    CmsContentEntryListSort,
    CmsContentEntryListWhere,
    CmsContentEntry,
    CmsContentIndexEntry,
    CmsContentModelField,
    CmsContentModel,
    CmsContext,
    CmsModelFieldToElasticsearchPlugin,
    CmsModelFieldToGraphQLPlugin,
    ElasticsearchQueryBuilderPlugin,
    ElasticsearchQuery,
    CmsContentEntryListArgs
} from "@webiny/api-headless-cms/types";
import { decodeElasticsearchCursor } from "@webiny/api-headless-cms/utils";
import Error from "@webiny/error";
import lodashCloneDeep from "lodash/cloneDeep";

interface ModelField {
    unmappedType?: (field: CmsContentModelField) => string;
    isSearchable: boolean;
    isSortable: boolean;
    type: string;
    isSystemField?: boolean;
}

type ModelFields = Record<string, ModelField>;

interface CreateElasticsearchParams {
    context: CmsContext;
    model: CmsContentModel;
    args: CmsContentEntryListArgs;
    ownedBy?: string;
    parentObject?: string;
    options?: CmsContentEntryListOptions;
}

interface CreateElasticsearchSortParams {
    sort: CmsContentEntryListSort;
    modelFields: ModelFields;
    parentObject?: string;
    model: CmsContentModel;
}

interface CreateElasticsearchQueryArgs {
    model: CmsContentModel;
    context: CmsContext;
    where: CmsContentEntryListWhere;
    modelFields: ModelFields;
    ownedBy?: string;
    parentObject?: string;
    options?: CmsContentEntryListOptions;
}

interface ElasticsearchSortParam {
    order: string;
}

type ElasticsearchSortFields = Record<string, ElasticsearchSortParam>;

const parseWhereKeyRegExp = new RegExp(/^([a-zA-Z0-9]+)(_[a-zA-Z0-9_]+)?$/);

const parseWhereKey = (key: string) => {
    const match = key.match(parseWhereKeyRegExp);

    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }

    const [, field, operation = "eq"] = match;
    const op = operation.match(/^_/) ? operation.substr(1) : operation;

    if (!field.match(/^([a-zA-Z]+)$/)) {
        throw new Error(`Cannot filter by "${field}".`);
    }

    return { field, op };
};

const sortRegExp = new RegExp(/^([a-zA-Z-0-9_]+)_(ASC|DESC)$/);

const createElasticsearchSortParams = (
    args: CreateElasticsearchSortParams
): ElasticsearchSortFields[] => {
    const { sort, modelFields, parentObject } = args;

    if (!sort) {
        return undefined;
    }

    const withParentObject = (field: string) => {
        if (!parentObject) {
            return null;
        }
        return `${parentObject}.${field}`;
    };

    return sort.map(value => {
        const match = value.match(sortRegExp);

        if (!match) {
            throw new Error(`Cannot sort by "${value}".`);
        }

        const [, field, order] = match;
        const modelFieldOptions = (modelFields[field] || {}) as any;
        const { isSortable = false, unmappedType, isSystemField = false } = modelFieldOptions;

        if (!isSortable) {
            throw new Error(`Field "${field}" is not sortable.`);
        }

        const name = isSystemField ? field : withParentObject(field);

        const fieldName = unmappedType ? name : `${name}.keyword`;
        return {
            [fieldName]: {
                order: order.toLowerCase() === "asc" ? "asc" : "desc",

                unmapped_type: unmappedType
            }
        };
    });
};

const createInitialQueryValue = (args: CreateElasticsearchQueryArgs): ElasticsearchQuery => {
    const { ownedBy, options, model, context } = args;

    const query: ElasticsearchQuery = {
        match: [],
        must: [
            // always search by given model id
            {
                term: {
                    "modelId.keyword": model.modelId
                }
            },
            // and in the given locale
            {
                term: {
                    "locale.keyword": context.cms.getLocale().code
                }
            }
        ],
        mustNot: [],
        should: []
    };

    // when permission has own property, this value is passed into the fn
    if (ownedBy) {
        query.must.push({
            term: {
                "ownedBy.id.keyword": ownedBy
            }
        });
    }

    // add more options if necessary
    const { type } = options || {};
    if (type) {
        query.must.push({
            term: {
                "__type.keyword": type
            }
        });
    }
    //
    return query;
};

/*
 * Iterate through where keys and apply plugins where necessary
 */
const execElasticsearchBuildQueryPlugins = (
    args: CreateElasticsearchQueryArgs
): ElasticsearchQuery => {
    const { where, modelFields, parentObject, context } = args;
    const query = createInitialQueryValue(args);

    const withParentObject = (field: string) => {
        if (!parentObject) {
            return null;
        }
        return `${parentObject}.${field}`;
    };

    const plugins = context.plugins.byType<ElasticsearchQueryBuilderPlugin>(
        "elastic-search-query-builder"
    );
    if (!where || Object.keys(where).length === 0) {
        return query;
    }

    for (const key in where) {
        const { field, op } = parseWhereKey(key);
        const modelFieldOptions = modelFields[field];
        const { isSearchable = false, isSystemField } = modelFieldOptions || {};

        if (!modelFieldOptions) {
            throw new Error(`There is no field "${field}".`);
        } else if (!isSearchable) {
            throw new Error(`Field "${field}" is not searchable.`);
        }

        for (const plugin of plugins) {
            if (plugin.operator !== op) {
                continue;
            }

            const fieldWithParent = isSystemField ? null : withParentObject(field);
            plugin.apply(query, {
                field: fieldWithParent || field,
                value: where[key],
                parentObject,
                originalField: fieldWithParent ? field : undefined
            });
        }
    }

    return query;
};

const ES_LIMIT_MAX = 10000;
const ES_LIMIT_DEFAULT = 50;

export const createElasticsearchLimit = (
    limit: number,
    defaultValue = ES_LIMIT_DEFAULT
): number => {
    if (!limit) {
        return defaultValue;
    }
    if (limit < ES_LIMIT_MAX) {
        return limit;
    }
    return ES_LIMIT_MAX - 1;
};

/*
 * Create an object with key fieldType and options for that field
 */
const createModelFieldOptions = (context: CmsContext, model: CmsContentModel): ModelFields => {
    const systemFields: ModelFields = {
        id: {
            type: "text",
            isSystemField: true,
            isSearchable: true,
            isSortable: true
        },
        savedOn: {
            type: "date",
            unmappedType: () => {
                return "date";
            },
            isSystemField: true,
            isSearchable: true,
            isSortable: true
        },
        createdOn: {
            type: "date",
            unmappedType: () => {
                return "date";
            },
            isSystemField: true,
            isSearchable: true,
            isSortable: true
        }
    };
    // collect all unmappedType from elastic plugins
    const unmappedTypes: ModelFields = context.plugins
        .byType<CmsModelFieldToElasticsearchPlugin>("cms-model-field-to-elastic-search")
        .reduce((acc, plugin) => {
            if (!plugin.unmappedType) {
                return acc;
            }
            acc[plugin.fieldType] = plugin.unmappedType;
            return acc;
        }, {});
    // collect all field types from
    const pluginFieldTypes = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((types, plugin) => {
            const { fieldType, isSearchable, isSortable } = plugin;
            const unmappedType = unmappedTypes[fieldType];
            types[fieldType] = {
                unmappedType: unmappedType,
                isSearchable: isSearchable === true,
                isSortable: isSortable === true
            };
            return types;
        }, {});

    return model.fields.reduce((fields, field) => {
        const { fieldId, type } = field;
        if (!pluginFieldTypes[type]) {
            throw new Error(`There is no plugin for field type "${type}".`);
        }
        const { isSearchable, isSortable, unmappedType } = pluginFieldTypes[type];
        fields[fieldId] = {
            type,
            isSearchable,
            isSortable,
            unmappedType: unmappedType(field),
            isSystemField: false
        };

        return fields;
    }, systemFields);
};

export const createElasticsearchParams = (params: CreateElasticsearchParams) => {
    const { context, model, args, ownedBy, parentObject = null, options } = params;
    const { where, after, limit, sort } = args;

    const modelFields = createModelFieldOptions(context, model);

    const query = execElasticsearchBuildQueryPlugins({
        model,
        context,
        where,
        modelFields,
        ownedBy,
        parentObject,
        options
    });

    return {
        query: {
            bool: {
                must: query.must.length > 0 ? query.must : undefined,

                must_not: query.mustNot.length > 0 ? query.mustNot : undefined,
                match: query.match.length > 0 ? query.match : undefined,
                should: query.should.length > 0 ? query.should : undefined
            }
        },
        sort: createElasticsearchSortParams({ sort, modelFields, parentObject, model }),
        size: limit + 1,
        // eslint-disable-next-line
        search_after: decodeElasticsearchCursor(after) || undefined
    };
};

interface SetupEntriesIndexHelpersArgs {
    context: CmsContext;
    model: CmsContentModel;
}
interface PrepareElasticsearchDataArgs extends SetupEntriesIndexHelpersArgs {
    storageEntry: CmsContentEntry;
    originalEntry: CmsContentEntry;
}
interface ExtractEntriesFromIndexArgs extends SetupEntriesIndexHelpersArgs {
    entries: CmsContentIndexEntry[];
}

const setupEntriesIndexHelpers = ({ context, model }: SetupEntriesIndexHelpersArgs) => {
    const plugins = context.plugins.byType<CmsModelFieldToElasticsearchPlugin>(
        "cms-model-field-to-elastic-search"
    );
    const fieldsAsObject: Record<string, CmsContentModelField> = {};
    for (const field of model.fields) {
        fieldsAsObject[field.fieldId] = field;
    }

    const fieldIndexPlugins: Record<string, CmsModelFieldToElasticsearchPlugin> = {};
    for (const plugin of plugins.reverse()) {
        if (fieldIndexPlugins[plugin.fieldType]) {
            continue;
        }
        fieldIndexPlugins[plugin.fieldType] = plugin;
    }
    // we will use this plugin if no targeted plugin found
    const defaultIndexFieldPlugin = plugins.find(plugin => plugin.fieldType === "*");
    return {
        fieldsAsObject,
        fieldIndexPlugins,
        defaultIndexFieldPlugin
    };
};

export const prepareEntryToIndex = (args: PrepareElasticsearchDataArgs): CmsContentIndexEntry => {
    const { context, originalEntry, storageEntry, model } = args;
    const fieldToElasticsearchPlugins = context.plugins.byType<CmsModelFieldToElasticsearchPlugin>(
        "cms-model-field-to-elastic-search"
    );
    // we will use this plugin if no targeted plugin found
    const defaultIndexFieldPlugin = fieldToElasticsearchPlugins.find(
        plugin => plugin.fieldType === "*"
    );

    const modelFieldToGraphqlPlugins = context.plugins.byType<CmsModelFieldToGraphQLPlugin>(
        "cms-model-field-to-graphql"
    );
    const mappedPluginFieldTypes: Record<string, CmsModelFieldToGraphQLPlugin> = {};
    for (const plugin of modelFieldToGraphqlPlugins) {
        mappedPluginFieldTypes[plugin.fieldType] = plugin;
    }

    const fieldsAsObject: Record<string, CmsContentModelField> = {};
    for (const field of model.fields) {
        fieldsAsObject[field.fieldId] = field;
    }

    const mappedFieldToElasticsearchPlugins: Record<
        string,
        CmsModelFieldToElasticsearchPlugin
    > = {};
    for (const plugin of fieldToElasticsearchPlugins.reverse()) {
        if (mappedFieldToElasticsearchPlugins[plugin.fieldType]) {
            continue;
        }
        mappedFieldToElasticsearchPlugins[plugin.fieldType] = plugin;
    }

    let toIndexEntry: CmsContentIndexEntry = {
        ...lodashCloneDeep(storageEntry),
        rawValues: {}
    };
    for (const fieldId in storageEntry.values) {
        if (storageEntry.values.hasOwnProperty(fieldId) === false) {
            continue;
        }

        const field = fieldsAsObject[fieldId];
        if (!field) {
            throw new Error(`There is no field type with fieldId "${fieldId}".`);
        }
        const fieldTypePlugin = mappedPluginFieldTypes[field.type];
        if (!fieldTypePlugin) {
            throw new Error(`Missing field type plugin "${field.type}".`);
        }

        const targetFieldPlugin =
            mappedFieldToElasticsearchPlugins[field.type] || defaultIndexFieldPlugin;
        // we decided to take only last registered plugin for given field type
        if (targetFieldPlugin && targetFieldPlugin.toIndex) {
            const newEntryValues = targetFieldPlugin.toIndex({
                context,
                model,
                field,
                toIndexEntry,
                originalEntry,
                storageEntry,
                fieldTypePlugin
            });
            toIndexEntry = {
                ...toIndexEntry,
                ...newEntryValues
            };
        }
    }
    return toIndexEntry;
};

export const extractEntriesFromIndex = ({
    context,
    entries,
    model
}: ExtractEntriesFromIndexArgs): CmsContentEntry[] => {
    const { fieldsAsObject, fieldIndexPlugins, defaultIndexFieldPlugin } = setupEntriesIndexHelpers(
        {
            context,
            model
        }
    );

    const mappedPluginFieldTypes: Record<
        string,
        CmsModelFieldToGraphQLPlugin
    > = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((plugins, plugin) => {
            plugins[plugin.fieldType] = plugin;
            return plugins;
        }, {});

    const list: CmsContentEntry[] = [];
    for (const entry of entries) {
        let fromIndexEntry: CmsContentIndexEntry = lodashCloneDeep(entry);
        for (const fieldId in fieldsAsObject) {
            if (fieldsAsObject.hasOwnProperty(fieldId) === false) {
                continue;
            }
            const field = fieldsAsObject[fieldId];
            const fieldTypePlugin = mappedPluginFieldTypes[field.type];
            if (!fieldTypePlugin) {
                throw new Error(`Missing field type plugin "${field.type}".`);
            }
            const targetFieldPlugin = fieldIndexPlugins[field.type] || defaultIndexFieldPlugin;
            if (targetFieldPlugin && targetFieldPlugin.fromIndex) {
                const calculatedEntry = targetFieldPlugin.fromIndex({
                    context,
                    model,
                    field,
                    entry: fromIndexEntry,
                    fieldTypePlugin
                });
                fromIndexEntry = {
                    ...fromIndexEntry,
                    ...calculatedEntry
                };
            }
        }
        list.push(fromIndexEntry);
    }

    return list;
};
