/**
 * Returns arguments suited to be sent to ElasticSearch's `search` method.
 * @param args
 */
export default args => {
    const normalized = {
        filter: getFilter(args.where),
        sort: getSort(args.sort),
        size: args.limit ?? 10,
        from: 0,
        page: args.page || 1,
    };

    normalized.from = (normalized.page - 1) * normalized.size;
    return normalized;
};

const getFilter = where => {
    if (!where) {
        return [];
    }

    const normalizedFilter = [];
    if (where.category) {
        normalizedFilter.push({ term: { "category.keyword": where.category } });
    }

    if (where.status) {
        normalizedFilter.push({ term: { "status.keyword": where.status } });
    }

    return normalizedFilter;
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
