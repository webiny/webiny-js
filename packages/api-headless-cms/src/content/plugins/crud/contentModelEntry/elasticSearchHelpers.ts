import {
    CmsContentModelEntryListOptionsType,
    CmsContentModelEntryListSortType,
    CmsContentModelEntryListWhereType,
    CmsContentModelType,
    CmsContext,
    CmsModelFieldToGraphQLPlugin,
    ElasticSearchQueryBuilderPlugin,
    ElasticSearchQueryType
} from "@webiny/api-headless-cms/types";
import { decodeElasticSearchCursor } from "@webiny/api-headless-cms/utils";

type ModelFieldType = {
    unmappedType?: string;
    isSearchable: boolean;
    isSortable: boolean;
    type: string;
    isSystemField?: boolean;
};

type ModelFieldsType = Record<string, ModelFieldType>;

type CreateElasticSearchParamsArgType = {
    where?: CmsContentModelEntryListWhereType;
    sort?: CmsContentModelEntryListSortType;
    limit: number;
    after?: string;
};

type CreateElasticSearchParamsType = {
    context: CmsContext;
    model: CmsContentModelType;
    args: CreateElasticSearchParamsArgType;
    ownedBy?: string;
    parentObject?: string;
    options?: CmsContentModelEntryListOptionsType;
};

type CreateElasticSearchSortParamsType = {
    sort: CmsContentModelEntryListSortType;
    modelFields: ModelFieldsType;
    parentObject?: string;
    model: CmsContentModelType;
};

type CreateElasticSearchQueryArgsType = {
    model: CmsContentModelType;
    context: CmsContext;
    where: CmsContentModelEntryListWhereType;
    modelFields: ModelFieldsType;
    ownedBy?: string;
    parentObject?: string;
    options?: CmsContentModelEntryListOptionsType;
};

type ElasticSearchSortParamType = {
    order: string;
};

type ElasticSearchSortFieldsType = Record<string, ElasticSearchSortParamType>;

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

const createElasticSearchSortParams = (
    args: CreateElasticSearchSortParamsType
): ElasticSearchSortFieldsType[] => {
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
                // eslint-disable-next-line @typescript-eslint/camelcase
                unmapped_type: unmappedType
            }
        };
    });
};

const createInitialQueryValue = (
    args: CreateElasticSearchQueryArgsType
): ElasticSearchQueryType => {
    const { ownedBy, options, model, context } = args;

    const query: ElasticSearchQueryType = {
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
const execElasticSearchBuildQueryPlugins = (
    args: CreateElasticSearchQueryArgsType
): ElasticSearchQueryType => {
    const { where = {}, modelFields, parentObject, context } = args;
    const query = createInitialQueryValue(args);

    const withParentObject = (field: string) => {
        if (!parentObject) {
            return null;
        }
        return `${parentObject}.${field}`;
    };

    const plugins = context.plugins.byType<ElasticSearchQueryBuilderPlugin>(
        "elastic-search-query-builder"
    );

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }

        const { field, op } = parseWhereKey(key);
        const modelFieldOptions = modelFields[field];
        const { isSearchable = false, isSystemField } = modelFieldOptions || {};

        if (!modelFieldOptions) {
            throw new Error(`There is no field "${field}".`);
        } else if (!isSearchable) {
            throw new Error(`Field "${field}" is not searchable.`);
        }

        for (const plugin of plugins) {
            if (plugin.targetOperation !== op) {
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

export const createElasticSearchLimit = (
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
const createModelFieldOptions = (
    context: CmsContext,
    model: CmsContentModelType
): ModelFieldsType => {
    const plugins = context.plugins.byType<CmsModelFieldToGraphQLPlugin>(
        "cms-model-field-to-graphql"
    );

    const modelFields = model.fields.map(field => {
        return {
            id: field.fieldId,
            type: field.type
        };
    });

    const systemFields: ModelFieldsType = {
        id: {
            type: "text",
            isSystemField: true,
            isSearchable: true,
            isSortable: true
        },
        savedOn: {
            type: "date",
            unmappedType: "date",
            isSystemField: true,
            isSearchable: true,
            isSortable: true
        },
        createdOn: {
            type: "date",
            unmappedType: "date",
            isSystemField: true,
            isSearchable: true,
            isSortable: true
        }
    };

    const pluginFieldTypes = plugins.reduce((types, plugin) => {
        const { fieldType, es, isSearchable, isSortable } = plugin;
        const { unmappedType } = es || {};
        types[fieldType] = {
            unmappedType: unmappedType || undefined,
            isSearchable: isSearchable === true,
            isSortable: isSortable === true
        };
        return types;
    }, {});

    return modelFields.reduce((fields, { id, type }) => {
        if (!pluginFieldTypes[type]) {
            throw new Error(`There is no plugin for field type "${type}".`);
        }
        const { isSearchable, isSortable, unmappedType } = pluginFieldTypes[type];
        fields[id] = {
            type,
            isSearchable,
            isSortable,
            unmappedType,
            isSystemField: false
        };

        return fields;
    }, systemFields);
};

export const createElasticSearchParams = (params: CreateElasticSearchParamsType) => {
    const { context, model, args, ownedBy, parentObject = null, options } = params;
    const { where, after, limit, sort } = args;

    const modelFields = createModelFieldOptions(context, model);

    const query = execElasticSearchBuildQueryPlugins({
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
                // eslint-disable-next-line @typescript-eslint/camelcase
                must_not: query.mustNot.length > 0 ? query.mustNot : undefined,
                match: query.match.length > 0 ? query.match : undefined,
                should: query.should.length > 0 ? query.should : undefined
            }
        },
        sort: createElasticSearchSortParams({ sort, modelFields, parentObject, model }),
        size: limit + 1,
        // eslint-disable-next-line
        search_after: decodeElasticSearchCursor(after) || undefined
    };
};
