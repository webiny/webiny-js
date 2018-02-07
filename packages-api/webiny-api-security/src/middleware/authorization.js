export default () => {
    /**
     * Authorization middleware
     *
     * @param {Object} params
     * @param {Request} params.req
     * @param {ApiMethod} params.apiMethod
     * @param {Api} params.app
     * @param next
     * @return {Promise<void>}
     */
    return async ({ req, apiMethod, app }, next) => {
        await app.getService("Authorization").canExecute(apiMethod, req.identity);
        next();
    };
};
