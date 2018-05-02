// @flow
export default () => {
    /**
     * Authorization middleware.
     * Checks if request identity is authorized to execute the matched API method.
     *
     * @param {Api} params.app
     * @param next
     */
    return async (params, next: Function) => {
        const identity = params.req.identity;
        if (!identity) {
            next();
        } else {
            // const scope = await identity.scope;
            // TODO: we must remove fields which cannot be fetched.
            /*    params.graphql.query.definitions.forEach(operation => {
                // const name = operation.selectionSet.selections[0].name.value;
                // const roles = identity.roles;
            });*/

            next();
        }
    };
};
