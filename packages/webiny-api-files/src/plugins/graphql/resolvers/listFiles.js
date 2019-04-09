// @flow
import type { Entity } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);
    const { page = 1, perPage = 10, sort = null, search = "", types = [] } = args;
    const findArgs = { page, perPage, sort, query: { $and: [{ type: { $in: types } }] } };
    if (search) {
        findArgs.query.$and.push({
            $or: [
                { name: { $regex: `.*${search}.*`, $options: "i" } },
                { tags: { $in: search.split(" ") } }
            ]
        });
    }

    const data = await entityClass.find(findArgs);
    return new ListResponse(data, data.getMeta());
};
