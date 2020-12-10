import { ListPagesArgs } from "@webiny/api-page-builder/types";

/**
 * Returns arguments suited to be sent to ElasticSearch's `search` method.
 * @param args
 */
export default (args: ListPagesArgs) => {
    const normalized = {
        query: getQuery(args),
        sort: getSort(args.sort),
        size: args.limit ?? 10,
        from: 0,
        page: args.page || 1
    };

    normalized.from = (normalized.page - 1) * normalized.size;
    return normalized;
};

const getQuery = args => {
    const { where, search } = args;
    const query: Record<string, any> = {
        bool: {
            filter: []
        }
    };

    if (where) {
        if (where.category) {
            query.bool.filter.push({ term: { "category.keyword": where.category } });
        }

        if (where.status) {
            query.bool.filter.push({ term: { "status.keyword": where.status } });
        }

        if (Array.isArray(where.tags) && where.tags.length > 0) {
            query.bool.filter.push({
                bool: {
                    must: where.tags.map(tag => ({
                        term: { "tags.keyword": tag }
                    }))
                }
            });
        }
    }

    if (search && search.query) {
        query.bool.must = {
            // eslint-disable-next-line @typescript-eslint/camelcase
            multi_match: {
                query: search.query,
                type: "most_fields",
                fields: ["title", "snippet"]
            }
        };
    }

    return query;
};

const getSort = sort => {
    if (!sort) {
        return {};
    }

    const normalizedSort: Record<string, any> = {};
    if (sort.createdOn) {
        normalizedSort["createdOn"] = sort.createdOn;
    }

    if (sort.publishedOn) {
        normalizedSort["publishedOn"] = sort.publishedOn;
    }

    if (sort.title) {
        normalizedSort["title.keyword"] = sort.title;
    }

    if (Object.keys(normalizedSort).length === 0) {
        return { createdOn: "desc" };
    }

    return normalizedSort;
};
