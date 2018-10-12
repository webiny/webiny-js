// @flow
import type { Entity } from "webiny-entity";
type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const User = entityFetcher(context);

    const { user } = context;

    const currentUser: ?Entity = await User.findById(user.id);
    if (currentUser) {
        currentUser.populate(args.data);
        await currentUser.save();
        return currentUser;
    }

    throw Error("User not found!");
};
