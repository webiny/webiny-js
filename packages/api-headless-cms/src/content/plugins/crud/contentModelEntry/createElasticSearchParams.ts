import {
    CmsContentModelEntryListArgsType,
    CmsContentModelEntryListSortType,
    CmsContentModelEntryListWhereType,
    CmsContentModelType,
    CmsContext,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";

type FieldType = {
    unmappedType?: string;
    isSearchable: boolean;
    isSortable: boolean;
};
type FieldsType = Record<string, FieldType>;
type CreateElasticSearchParamsArgsType = {
    context: CmsContext;
    model: CmsContentModelType;
    args: CmsContentModelEntryListArgsType;
    onlyOwned?: boolean;
};
type CreateElasticSearchSortParamsType = {
    sort: CmsContentModelEntryListSortType;
    fields: FieldsType;
};
type CreateElasticSearchQueryMustParamsType = {
    context: CmsContext;
    where: CmsContentModelEntryListWhereType;
    fields: FieldsType;
    onlyOwned?: boolean;
};
type ElasticSearchSortParamType = {
    order: string;
};
type ElasticSearchSortFieldsType = Record<string, ElasticSearchSortParamType>;

type ElasticSearchQueryMustParamType = {
    must: {
        [key: string]: any;
    };
};
type ElasticSearchQueryMustParamListType = ElasticSearchQueryMustParamType[];

const decodeCursor = (cursor?: string) => {
    if (!cursor) {
        return null;
    }

    return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
};

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
const createElasticSearchQueryMustParams = ({
    context,
    where,
    fields,
    onlyOwned
}: CreateElasticSearchQueryMustParamsType): ElasticSearchQueryMustParamListType => {
    const must = [];
    must.push({
        term: {
            "__type.keyword": "cms.entry"
        }
    });
    must.push({
        term: {
            "locale.keyword": context.cms.getLocale().code
        }
    });
    if (onlyOwned) {
        must.push({
            term: {
                "ownedBy.id.keyword": context.security.getIdentity().id
            }
        });
    }
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        if (op !== "eq") {
            continue;
        }
        if (!fields[field]) {
            throw new Error(`There is no field "${field}" to use in where condition.`);
        }
        must.push({
            term: {
                [`${field}.keyword`]: where[key]
            }
        });
    }
    return must;
};

const sortRegExp = new RegExp(/^([a-zA-Z-0-9_]+)_(ASC|DESC)$/);

const creteElasticSearchSortParams = ({
    sort,
    fields
}: CreateElasticSearchSortParamsType): ElasticSearchSortFieldsType[] => {
    return sort.map(value => {
        const match = value.match(sortRegExp);
        if (!match) {
            throw new Error(`Cannot sort by "${value}".`);
        }
        const [field, order] = match;
        if (!fields[field]) {
            throw new Error(`It is not possible to sort by field "${field}".`);
        }
        return {
            [field]: {
                order: order.toLowerCase() === "asc" ? "asc" : "desc",
                // eslint-disable-next-line @typescript-eslint/camelcase
                unmapped_type: fields[field].unmappedType || undefined
            }
        };
    });
};

export const createElasticSearchParams = ({
    context,
    model,
    args,
    onlyOwned
}: CreateElasticSearchParamsArgsType) => {
    const { where, after, limit = 100, sort } = args;
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
    return {
        query: {
            must: createElasticSearchQueryMustParams({ context, where, fields, onlyOwned })
        },
        sort: creteElasticSearchSortParams({ sort, fields }),
        size: limit + 1,
        // eslint-disable-next-line
        search_after: decodeCursor(after)
    };
};
