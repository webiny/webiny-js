// @flow
import { Response, NotFoundResponse } from "@webiny/api";
import prepareMenuItems from "./prepareMenuItems";

export default async (root: any, args: Object, context: Object) => {
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
