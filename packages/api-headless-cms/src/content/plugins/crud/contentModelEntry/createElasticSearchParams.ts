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
type CreateElasticSearchParamsType = {
    context: CmsContext;
    model: CmsContentModelType;
    args: CmsContentModelEntryListArgsType;
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

type ElasticSearchQueryMustParamType = {
    term: {
        [key: string]: any;
    };
};
type ElasticSearchQueryMustParamListType = ElasticSearchQueryMustParamType[];

type ElasticSearchQueryMustNotParamType = {
    term: {
        [key: string]: any;
    };
};
type ElasticSearchQueryMustNotParamListType = ElasticSearchQueryMustNotParamType[];

type ElasticSearchQueryRangeParamType = {
    [key: string]: {
        lte?: string | number;
        gte?: string | number;
    };
};
type ElasticSearchQueryRangeParamListType = ElasticSearchQueryRangeParamType[];

type ElasticSearchQueryMatchParamType = {
    [key: string]: {
        query: string;
        // OR is default one in ES
        operator?: "AND" | "OR";
    };
};
type ElasticSearchQueryMatchParamListType = ElasticSearchQueryMatchParamType[];

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
const createElasticSearchQueryMustParams = (args: CreateElasticSearchQueryArgsType) => {
    const { context, where, fields, onlyOwned } = args;
    const must: ElasticSearchQueryMustParamListType = [];
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
        if (op !== "eq" && op !== "in") {
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

const createElasticSearchQueryMustNotParams = (args: CreateElasticSearchQueryArgsType) => {
    const { where, fields } = args;
    const mustNot: ElasticSearchQueryMustNotParamListType = [];
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        if (op !== "not" && op !== "not_in" && op !== "not_contains") {
            continue;
        }
        if (!fields[field]) {
            throw new Error(`There is no field "${field}" to use in where condition.`);
        }
        mustNot.push({
            term: {
                [`${field}.keyword`]: where[key]
            }
        });
    }
    return mustNot;
};

const createElasticSearchQueryRangeParams = (args: CreateElasticSearchQueryArgsType) => {
    const { where, fields } = args;
    const range: ElasticSearchQueryRangeParamListType = [];
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        if (op !== "between" && op !== "not_between") {
            continue;
        }
        if (Array.isArray(where[key]) === false || where[key].length !== 2) {
            throw new Error(
                `You must send an array of two elements for "between" filter to work on field "${field}".`
            );
        }
        if (!fields[field]) {
            throw new Error(`There is no field "${field}" to use in where condition.`);
        }
        const values = where[key] as string[];
        const [lte, gte] = op === "between" ? values : values.reverse();
        range.push({
            [`${field}.keyword`]: {
                lte,
                gte
            }
        });
    }
    return range;
};

const createElasticSearchQueryMatchParams = (args: CreateElasticSearchQueryArgsType) => {
    const { where, fields } = args;
    const match: ElasticSearchQueryMatchParamListType = [];
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        if (op !== "contains") {
            continue;
        }
        if (!fields[field]) {
            throw new Error(`There is no field "${field}" to use in where condition.`);
        }
        match.push({
            [field]: {
                query: where[key],
                operator: "AND"
            }
        });
    }
    return match;
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

export const createElasticSearchParams = (params: CreateElasticSearchParamsType) => {
    const { context, model, args, onlyOwned } = params;
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
            must: createElasticSearchQueryMustParams({ context, where, fields, onlyOwned }),
            // eslint-disable-next-line @typescript-eslint/camelcase
            must_not: createElasticSearchQueryMustNotParams({ context, where, fields, onlyOwned }),
            range: createElasticSearchQueryRangeParams({ context, where, fields, onlyOwned }),
            match: createElasticSearchQueryMatchParams({ context, where, fields, onlyOwned })
        },
        sort: creteElasticSearchSortParams({ sort, fields }),
        size: limit + 1,
        // eslint-disable-next-line
        search_after: decodeCursor(after)
    };
};
