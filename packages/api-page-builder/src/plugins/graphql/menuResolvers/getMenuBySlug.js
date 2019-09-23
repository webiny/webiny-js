// @flow
import { Response, NotFoundResponse } from "@webiny/api/graphql/responses";
import prepareMenuItems from "./prepareMenuItems";

export default async (root: any, args: Object, context: Object) => {
    const { slug } = args;
    const { PbMenu } = context.models;

    const entity = await PbMenu.findOne({ query: { slug } });
    if (!entity) {
        return new NotFoundResponse("Menu not found.");
    }

    return new Response({
        id: entity.id,
        title: entity.title,
        items: prepareMenuItems({ entity, context })
    });
};
