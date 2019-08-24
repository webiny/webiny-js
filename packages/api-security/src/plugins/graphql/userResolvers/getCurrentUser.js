// @flow
import { Response, NotFoundResponse } from "@webiny/api/graphql";
import type { Entity } from "@webiny/entity";
type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const User = entityFetcher(context);

    const { user } = context;

    if (user) {
        const instance = await User.findById(user.id);
        if (!instance) {
            return new NotFoundResponse(`User with ID ${user.id} was not found!`);
        }

        return new Response(instance);
    }

    return new Response(null);
};
