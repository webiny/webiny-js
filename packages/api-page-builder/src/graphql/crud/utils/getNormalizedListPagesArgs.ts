import { ListPagesArgs, PbContext } from "../../types";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

/**
 * Returns arguments suited to be sent to ElasticSearch's `search` method.
 */
export default (args: ListPagesArgs, context: PbContext) => {
    const normalized = {
        query: getQuery(args, context),
        sort: getSort(args.sort),
        size: args.limit ?? 10,
        from: 0,
        page: args.page || 1
    };

    normalized.from = (normalized.page - 1) * normalized.size;
    return normalized;
};

const getQuery = (args: ListPagesArgs, context: PbContext): ElasticsearchQuery => {
    const { where, search, exclude } = args;
    const query: ElasticsearchQuery = {
        filter: [],
        must: [],
        mustNot: [],
        should: []
    };

    // When ES index is shared between tenants, we need to filter records by tenant ID
    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
    if (sharedIndex) {
        const tenant = context.security.getTenant();
        query.filter.push({ term: { "tenant.keyword": tenant.id } });
    }

    if (where) {
        if (where.category) {
            query.filter.push({ term: { "category.keyword": where.category } });
        }

        if (where.status) {
            query.filter.push({ term: { "status.keyword": where.status } });
        }

        const tags = where.tags;
        if (tags && Array.isArray(tags.query) && tags.query.length > 0) {
            if (tags.rule === "any") {
                query.filter.push({
                    terms: { "tags.keyword": tags.query }
                });
            } else {
                query.filter.push({
                    bool: {
                        must: where.tags.query.map(tag => ({
                            term: { "tags.keyword": tag }
                        }))
                    }
                });
            }
        }
    }

    if (search && search.query) {
        query.must.push({
            query_string: {
                query: `*${search.query}*`,
                allow_leading_wildcard: true,
                fields: ["title", "snippet"]
            }
        });
    }
    // Prepare query to exclude page which match provided id and/or path.
    if (Array.isArray(exclude) && exclude.length !== 0) {
        const paths = [];
        const pageIds = [];

        exclude.forEach(item => {
            // Page "path" will always starts with a slash.
            if (item.includes("/")) {
                paths.push(item);
            } else {
                pageIds.push(item);
            }
        });

        if (paths.length) {
            query.mustNot.push({
                terms: {
                    "path.keyword": paths
                }
            });
        }

        if (pageIds.length) {
            query.mustNot.push({
                terms: {
                    pid: pageIds
                }
            });
        }
    }

    return query;
};

const getSort = sort => {
    if (!sort) {
        return {};
    }

    const normalizedSort: Record<string, any> = {};
    if (sort.createdOn) {
        normalizedSort["createdOn"] = {
            order: sort.createdOn,

            unmapped_type: "date"
        };
    }

    if (sort.publishedOn) {
        normalizedSort["publishedOn"] = {
            order: sort.publishedOn,

            unmapped_type: "date"
        };
    }

    if (sort.title) {
        normalizedSort["titleLC.keyword"] = {
            order: sort.title,

            unmapped_type: "text"
        };
    }

    return normalizedSort;
};
