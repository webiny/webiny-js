// @flow
import { Entity } from "webiny-entity";
import { Response, NotFoundResponse } from "webiny-api/graphql/responses";
import prepareMenuItems from "./prepareMenuItems";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const { slug } = args;
    const entityClass = entityFetcher(context);

    const entity = await entityClass.findOne({ query: { slug } });
    if (!entity) {
        return new NotFoundResponse("Menu not found.");
    }

    return new Response({
        id: entity.id,
        title: entity.title,
        items: prepareMenuItems({ entity, context })
    });
};
