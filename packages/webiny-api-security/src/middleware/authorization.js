// @flow

export default () => {
    /**
     * Authorization middleware.
     * Checks if request identity is authorized to execute the matched API method.
     *
     * @param {Object} params
     * @param {Request} params.req
     * @param {Api} params.app
     * @param next
     * @return {Promise<void>}
     */
    return async (params, next: Function) => {
        const identity = params.req.identity;
        if (!identity) {
            return;
        }

        // TODO: we must remove fields which cannot be fetched.
        /*    params.graphql.query.definitions.forEach(operation => {
            // const name = operation.selectionSet.selections[0].name.value;
            // const roles = identity.roles;
        });*/

        next();
    };
};
