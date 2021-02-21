import { ListBooksWhere } from "./types";

/**
 * A basic filtering functionality for Elasticsearch.
 */
export const createElasticsearchQuery = (where?: ListBooksWhere) => {
    if (!where || Object.keys(where).length === 0) {
        return undefined;
    }
    const query = {
        must: [],
        mustNot: []
    };
    if (where.id) {
        query.must.push({
            term: {
                ["id.keyword"]: where.id
            }
        });
    }
    if (where.id_in) {
        query.must.push({
            terms: {
                ["id.keyword"]: where.id_in
            }
        });
    }
    if (where.id_not) {
        query.mustNot.push({
            term: {
                ["id.keyword"]: where.id_not
            }
        });
    }
    if (where.id_not_in) {
        query.mustNot.push({
            terms: {
                ["id.keyword"]: where.id_not_in
            }
        });
    }
    if (where.savedOn_gt) {
        query.must.push({
            range: {
                savedOn_gt: {
                    gt: where.savedOn_gt
                }
            }
        });
    }
    if (where.savedOn_lt) {
        query.must.push({
            range: {
                savedOn_lt: {
                    lt: where.savedOn_lt
                }
            }
        });
    }
    if (where.createdOn_gt) {
        query.must.push({
            range: {
                createdOn_gt: {
                    gt: where.createdOn_gt
                }
            }
        });
    }
    if (where.createdOn_lt) {
        query.must.push({
            range: {
                createdOn_lt: {
                    lt: where.createdOn_lt
                }
            }
        });
    }
    if (where.title_contains) {
        query.must.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: "title",
                query: `*${where.title_contains}*`
            }
        });
    }
    if (where.title_not_contains) {
        query.mustNot.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: "title",
                query: `*${where.title_not_contains}*`
            }
        });
    }
    if (where.isNice !== undefined) {
        query.must.push({
            term: {
                ["isNice.keyword"]: where.isNice
            }
        });
    }

    return query;
};

export const encodeElasticsearchCursor = (cursor?: any) => {
    if (!cursor) {
        return null;
    }

    return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeElasticsearchCursor = (cursor?: string) => {
    if (!cursor) {
        return null;
    }

    return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
};
