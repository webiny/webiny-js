import {
    CmsContentModelEntryListSortType,
    CmsContentModelEntryListWhereType,
    CmsContentModelType,
    CmsContext,
    CmsModelFieldToGraphQLPlugin,
    ElasticSearchQueryBuilderPlugin,
    ElasticSearchQueryType
} from "@webiny/api-headless-cms/types";
import { decodeElasticSearchCursor } from "@webiny/api-headless-cms/utils";

type FieldType = {
    unmappedType?: string;
    isSearchable: boolean;
    isSortable: boolean;
};
type FieldsType = Record<string, FieldType>;

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
};
type CreateElasticSearchSortParamsType = {
    sort: CmsContentModelEntryListSortType;
    fields: FieldsType;
    parentObject?: string;
    model: CmsContentModelType;
};
type CreateElasticSearchQueryArgsType = {
    model: CmsContentModelType;
    context: CmsContext;
    where: CmsContentModelEntryListWhereType;
    fields: FieldsType;
    ownedBy?: string;
    parentObject?: string;
};
type ElasticSearchSortParamType = {
    order: string;
};
type ElasticSearchSortFieldsType = Record<string, ElasticSearchSortParamType>;

const parseWhereKeyRegExp = new RegExp(/^([a-zA-Z0-9]+)_?([a-zA-Z0-9_]+)$/);
const parseWhereKey = (key: string) => {
    const match = key.match(parseWhereKeyRegExp);
    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }
    const [field, op = "eq"] = match;
    return {
        field,
        op
    };
};

const sortRegExp = new RegExp(/^([a-zA-Z-0-9_]+)_(ASC|DESC)$/);

const creteElasticSearchSortParams = (
    args: CreateElasticSearchSortParamsType
): ElasticSearchSortFieldsType[] => {
    const { sort, fields, model, parentObject } = args;
    const checkIsSystemField = (field: string) => {
        return !!model[field];
    };
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
        const [field, order] = match;
        const isSystemField = checkIsSystemField(field);
        if (!fields[field] && !isSystemField) {
            throw new Error(`It is not possible to sort by field "${field}".`);
        } else if (!fields[field].isSortable && !isSystemField) {
            throw new Error(`Field "${field}" is not sortable.`);
        }
        const fieldName = isSystemField ? field : withParentObject(field);
        return {
            [fieldName]: {
                order: order.toLowerCase() === "asc" ? "asc" : "desc",
                // eslint-disable-next-line @typescript-eslint/camelcase
                unmapped_type: fields[field].unmappedType || undefined
            }
        };
    });
};

const execElasticSearchBuildQueryPlugins = (
    plugins: ElasticSearchQueryBuilderPlugin[],
    args: CreateElasticSearchQueryArgsType
): ElasticSearchQueryType => {
    const { where, fields, parentObject, ownedBy, model, context } = args;
    const query: ElasticSearchQueryType = {
        match: [],
        must: [
            // always search by given model id
            { term: { "modelId.keyword": model.modelId } },
            // and in the given locale
            { term: { "locale.keyword": context.cms.getLocale().code } }
        ],
        mustNot: [],
        should: []
    };
    // also search for exact user if required
    if (ownedBy) {
        query.must.push({
            term: { "ownedBy.id.keyword": ownedBy }
        });
    }
    const checkIsSystemField = (field: string) => {
        return !!model[field];
    };
    const withParentObject = (field: string) => {
        if (!parentObject) {
            return null;
        }
        return `${parentObject}.${field}`;
    };
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        const isSystemField = checkIsSystemField(field);
        if (!fields[field] && !isSystemField) {
            throw new Error(`There is no field "${field}".`);
        } else if (!fields[field].isSearchable && !isSystemField) {
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

export const createElasticSearchParams = (params: CreateElasticSearchParamsType) => {
    const { context, model, args, ownedBy, parentObject = null } = params;
    const { where, after, limit, sort } = args;
    const plugins = context.plugins.byType<CmsModelFieldToGraphQLPlugin>(
        "cms-model-field-to-graphql"
    );

    const modelFields = model.fields.map(field => {
        return field.type;
    });

    const fields: FieldsType = plugins.reduce((acc, pl) => {
        if (modelFields.includes(pl.fieldType) === false) {
            return acc;
        }
        acc[pl.fieldType] = {
            unmappedType: pl.es && pl.es.unmappedType ? pl.es.unmappedType : null,
            isSearchable: pl.isSearchable === true,
            isSortable: pl.isSortable === true
        };
        return acc;
    }, {});
    const elasticSearchBuildQueryPlugins = context.plugins.byType<ElasticSearchQueryBuilderPlugin>(
        "elastic-search-query-builder"
    );
    const query = execElasticSearchBuildQueryPlugins(elasticSearchBuildQueryPlugins, {
        model,
        context,
        where,
        fields,
        ownedBy,
        parentObject
    });
    return {
        query: {
            // eslint-disable-next-line @typescript-eslint/camelcase
            constant_score: {
                bool: {
                    must: query.must.length > 0 ? query.must : undefined,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    must_not: query.mustNot.length > 0 ? query.mustNot : undefined,
                    match: query.match.length > 0 ? query.match : undefined,
                    should: query.should.length > 0 ? query.should : undefined
                }
            }
        },
        sort: creteElasticSearchSortParams({ sort, fields, parentObject, model }),
        size: limit + 1,
        // eslint-disable-next-line
        search_after: decodeElasticSearchCursor(after)
    };
};
