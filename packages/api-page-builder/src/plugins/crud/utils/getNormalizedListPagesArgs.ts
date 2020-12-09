import { ListPagesArgs } from "@webiny/api-page-builder/types";

/**
 * Returns arguments suited to be sent to ElasticSearch's `search` method.
 * @param args
 */
export default (args: ListPagesArgs) => {
    const normalized = {
        must: getMust(args.where),
        sort: getSort(args.sort),
        size: args.limit ?? 10,
        from: 0,
        page: args.page || 1
    };

    normalized.from = (normalized.page - 1) * normalized.size;
    return normalized;
};

const getMust = where => {
    if (!where) {
        return [];
    }

    const must = [];
    if (where.category) {
        must.push({ term: { "category.keyword": where.category } });
    }

    if (where.status) {
        must.push({ term: { "status.keyword": where.status } });
    }

    if (Array.isArray(where.tags) && where.tags.length > 0) {
        must.push({
            bool: {
                must: where.tags.map(tag => ({
                    term: { "tags.keyword": tag }
                }))
            }
        });
    }

    return must;
};

const getSort = sort => {
    if (!sort) {
        return { createdOn: "desc" };
    }

    const normalizedSort: Record<string, any> = {};
    if (sort.createdOn) {
        normalizedSort["createdOn"] = sort.createdOn;
    }

    if (sort.title) {
        normalizedSort["title.keyword"] = sort.title;
    }

    if (Object.keys(normalizedSort).length === 0) {
        return { createdOn: "desc" };
    }

    return normalizedSort;
};
