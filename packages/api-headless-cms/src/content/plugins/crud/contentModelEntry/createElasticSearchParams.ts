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
    onlyOwned?: boolean;
};
type CreateElasticSearchSortParamsType = {
    sort: CmsContentModelEntryListSortType;
    fields: FieldsType;
};
type CreateElasticSearchQueryArgsType = {
    context: CmsContext;
    where: CmsContentModelEntryListWhereType;
    fields: FieldsType;
    onlyOwned?: boolean;
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

const creteElasticSearchSortParams = ({
    sort,
    fields
}: CreateElasticSearchSortParamsType): ElasticSearchSortFieldsType[] => {
    return sort
        .map(value => {
            const match = value.match(sortRegExp);
            if (!match) {
                throw new Error(`Cannot sort by "${value}".`);
            }
            const [field, order] = match;
            if (!fields[field]) {
                throw new Error(`It is not possible to sort by field "${field}".`);
            }
            if (!fields[field].isSortable) {
                throw new Error(`Field "${field}" is not sortable.`);
            }
            return {
                [field]: {
                    order: order.toLowerCase() === "asc" ? "asc" : "desc",
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    unmapped_type: fields[field].unmappedType || undefined
                }
            };
        })
        .filter(value => !!value);
};

const execElasticSearchBuildQueryPlugins = (
    plugins: ElasticSearchQueryBuilderPlugin[],
    args: CreateElasticSearchQueryArgsType
): ElasticSearchQueryType => {
    const { where, fields } = args;
    const query: ElasticSearchQueryType = {
        match: [],
        must: [],
        mustNot: [],
        range: []
    };
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        if (!fields[field]) {
            throw new Error(`There is no field "${field}".`);
        }
        if (!fields[field].isSearchable) {
            throw new Error(`Field "${field}" is not searchable.`);
        }
        for (const plugin of plugins) {
            if (plugin.targetOperation !== op) {
                continue;
            }
            plugin.apply(query, {
                field,
                value: where[key]
            });
        }
    }
    return query;
};

export const createElasticSearchParams = (params: CreateElasticSearchParamsType) => {
    const { context, model, args, onlyOwned } = params;
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
        context,
        where,
        fields,
        onlyOwned
    });
    return {
        query: {
            must: query.must.length > 0 ? query.must : undefined,
            // eslint-disable-next-line @typescript-eslint/camelcase
            must_not: query.mustNot.length > 0 ? query.mustNot : undefined,
            range: query.range.length > 0 ? query.range : undefined,
            match: query.match.length > 0 ? query.match : undefined
        },
        sort: creteElasticSearchSortParams({ sort, fields }),
        size: limit + 1,
        // eslint-disable-next-line
        search_after: decodeElasticSearchCursor(after)
    };
};
