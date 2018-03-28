// @flow
import { app } from "webiny-api";
import type { MatchedApiMethod } from "webiny-api";

export default () => {
    /**
     * Authorization middleware.
     * Checks if request identity is authorized to execute the matched API method.
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
        await app.services
            .get("authorization")
            .canExecute(matchedApiMethod.getApiMethod(), req.identity);
        next();
    };
};
