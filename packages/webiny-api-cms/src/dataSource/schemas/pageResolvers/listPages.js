// @flow
import type { Entity, EntityCollection } from "webiny-entity";
import parseBoolean from "webiny-api/graphql/parseBoolean";
import { ListResponse } from "webiny-api/graphql/responses";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);

    parseBoolean(args);

    const query = { ...args.where };
    if (args.search && args.search.query) {
        query.$search = {
            query: args.search.query,
            columns: args.search.fields,
            operator: args.search.operator || "or"
        };
    }

    const data: EntityCollection<Entity> = await entityClass.find({
        query,
        page: args.page,
        perPage: args.perPage,
        sort: {
            published: -1,
            version: -1,
            ...(args.sort || {})
        },
        groupBy: ["parent"]
    });

    const meta = data.getParams();
    meta.count = data.length;
    meta.totalCount = data.getMeta().totalCount;
    meta.totalPages = Math.ceil(meta.totalCount / meta.perPage);
    meta.to = (meta.page - 1) * meta.perPage + meta.count;
    meta.from = meta.to - meta.count + 1;
    meta.nextPage = meta.page < meta.totalPages ? meta.page + 1 : null;
    meta.previousPage = meta.page === 1 ? null : meta.page - 1;

    return new ListResponse(data, meta);
};