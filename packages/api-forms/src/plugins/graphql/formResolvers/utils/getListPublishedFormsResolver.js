// @flow
export default (context: Object) => {
    const plugin = context.plugins.byName("forms-resolver-list-published-forms");
    if (!plugin) {
        throw Error(`Resolver plugin "forms-resolver-list-published-forms" is not configured!`);
    }

    return plugin;
};
