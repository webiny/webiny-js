// @flow
import { Response, NotFoundResponse } from "@webiny/api/graphql";

export default async (root: any, args: Object, context: Object) => {
    const { user } = context;

    if (user) {
        const { SecurityUser } = context.models;
        const instance = await SecurityUser.findById(user.id);
        if (!instance) {
            return new NotFoundResponse(`User with ID ${user.id} was not found!`);
        }

        return new Response(instance);
    }

    return new Response(null);
};
