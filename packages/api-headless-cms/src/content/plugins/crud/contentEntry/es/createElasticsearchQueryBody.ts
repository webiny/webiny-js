import {
    CmsContentEntryListOptions,
    CmsContentEntryListSort,
    CmsContentEntryListWhere,
    CmsContentModel,
    CmsContext,
    CmsModelFieldToElasticsearchPlugin,
    CmsModelFieldToGraphQLPlugin,
    ElasticsearchQuery,
    CmsContentEntryListArgs,
    CmsContentModelField,
    ElasticsearchQueryPlugin
} from "../../../../../types";
import { decodeElasticsearchCursor } from "../../../../../utils";
import Error from "@webiny/error";
import WebinyError from "@webiny/error";
import { operatorPluginsList } from "./operatorPluginsList";
import { transformValueForSearch } from "./transformValueForSearch";
import { searchPluginsList } from "./searchPluginsList";

interface ModelField {
    unmappedType?: string;
    isSearchable: boolean;
    isSortable: boolean;
    type: string;
    isSystemField?: boolean;
    field: CmsContentModelField;
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

    if (!where || Object.keys(where).length === 0) {
        return query;
    }

    const operatorPlugins = operatorPluginsList(context);
    const searchPlugins = searchPluginsList(context);

    for (const key in where) {
        const { field, op } = parseWhereKey(key);
        const modelFieldOptions = modelFields[field];
        const { isSearchable = false, isSystemField, field: cmsField } = modelFieldOptions || {};

        if (!modelFieldOptions) {
            throw new Error(`There is no field "${field}".`);
        } else if (!isSearchable) {
            throw new Error(`Field "${field}" is not searchable.`);
        }
        const plugin = operatorPlugins[op];
        if (!plugin) {
            throw new WebinyError("Operator plugin missing.", "PLUGIN_MISSING", {
                operator: op
            });
        }
        const value = transformValueForSearch({
            plugins: searchPlugins,
            field: cmsField,
            value: where[key],
            context
        });
        const fieldWithParent = isSystemField ? null : withParentObject(field);
        plugin.apply(query, {
            field: fieldWithParent || field,
            value,
            parentObject,
            originalField: fieldWithParent ? field : undefined,
            context
        });
    }

    return query;
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
            isSortable: true,
            field: ({
                type: "text"
            } as unknown) as CmsContentModelField
        },
        savedOn: {
            type: "date",
            unmappedType: "date",
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: ({
                type: "date",
                settings: {
                    type: "dateTimeWithoutTimezone"
                }
            } as unknown) as CmsContentModelField
        },
        createdOn: {
            type: "date",
            unmappedType: "date",
            isSystemField: true,
            isSearchable: true,
            isSortable: true,
            field: ({
                type: "text",
                settings: {
                    type: "dateTimeWithoutTimezone"
                }
            } as unknown) as CmsContentModelField
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
            types[fieldType] = {
                unmappedType: unmappedTypes[fieldType],
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
            unmappedType: unmappedType ? unmappedType(field) : undefined,
            isSystemField: false,
            field
        };

        return fields;
    }, systemFields);
};

export const createElasticsearchQueryBody = (params: CreateElasticsearchParams) => {
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

    const queryPlugins = context.plugins.byType<ElasticsearchQueryPlugin>(
        "cms-elasticsearch-query"
    );
    for (const pl of queryPlugins) {
        pl.modify({ query, model, context });
    }

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
        search_after: decodeElasticsearchCursor(after) || undefined,
        // eslint-disable-next-line
        track_total_hits: true
    };
};
