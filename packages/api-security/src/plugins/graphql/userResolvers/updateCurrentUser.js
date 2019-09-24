// @flow
import { Response, NotFoundResponse, ErrorResponse } from "@webiny/api/graphql";
import type { Entity } from "@webiny/entity";
type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const User = entityFetcher(context);

    const { user, plugins } = context;

    const currentUser: ?Entity = await User.findById(user.id);
    if (currentUser) {
        try {
            currentUser.populate(args.data);
            await currentUser.save();

            const authPlugin = plugins
                .byType("security-authentication-provider")
                .filter(pl => pl.hasOwnProperty("updateUser"))
                .pop();

            await authPlugin.updateUser({ data: args.data, user: currentUser }, context);

            return new Response(currentUser);
        } catch (e) {
            return new ErrorResponse({
                code: e.code,
                message: e.message,
                data: e.data || null
            });
        }
    }

    return new NotFoundResponse("User not found!");
};
