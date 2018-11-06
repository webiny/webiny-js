// @flow
type EntityFetcher = (context: Object) => any;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const UserSettings = entityFetcher(context);

    const { user } = context;

    if (!user) {
        throw Error("User not authenticated!");
    }

    let settings = await UserSettings.load(args.key);

    if (!settings) {
        settings = new UserSettings();
        settings.key = args.key;
    }

    settings.data = args.data;
    await settings.save();
    return settings.data;
};
