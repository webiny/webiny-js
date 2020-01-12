export default (context: {[key: string]: any}) => {
    const plugin = context.plugins.byName("forms-resolver-list-published-forms");
    if (!plugin) {
        throw Error(`Resolver plugin "forms-resolver-list-published-forms" is not configured!`);
    }

    return plugin;
};
