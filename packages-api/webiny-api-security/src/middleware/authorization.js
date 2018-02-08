// @flow
import api from "webiny-api";
import type { MatchedApiMethod } from "webiny-api";

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
    return async (
        params: { req: express$Request, matchedApiMethod: MatchedApiMethod },
        next: Function
    ) => {
        const { req, matchedApiMethod } = params;
        await api.serviceManager
            .get("Authorization")
            .canExecute(matchedApiMethod.getApiMethod(), req.identity);
        next();
    };
};
