import { Response, NotFoundResponse } from "@webiny/graphql";
import prepareMenuItems from "./prepareMenuItems";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { slug } = args;
    const { PbMenu } = context.models;

    const menu = await PbMenu.findOne({ query: { slug } });
    if (!menu) {
        return new NotFoundResponse("Menu not found.");
    }

    return new Response({
        id: menu.id,
        title: menu.title,
        items: prepareMenuItems({ menu, context })
    });
};

export default resolver;
