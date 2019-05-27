// @flow
type EntityFetcher = (context: Object) => any;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const UserSettings = entityFetcher(context);

    const { user } = context;
    if (user) {
        const settings = await UserSettings.load(args.key);
        if (settings) {
            return settings.data;
        }
    }

    return null;
};
