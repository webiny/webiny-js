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

    return user ? await User.findById(user.id) : null;
};
