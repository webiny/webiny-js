// @flow
import debug from "debug";
import _ from "lodash";
import compose from "webiny-compose";
import semver from "semver";
import api, { ApiResponse } from "./../index";
import ApiErrorResponse from "../response/apiErrorResponse";

declare type EndpointMiddlewareOptions = {
    beforeApiMethod?: Array<Function>,
    afterApiMethod?: Array<Function>
};

export default (options: EndpointMiddlewareOptions = {}) => {
    // Endpoint hooks in form of a middleware
    const beforeApiMethodMiddleware = compose(_.get(options, "beforeApiMethod", []));
    const afterApiMethodMiddleware = compose(_.get(options, "afterApiMethod", []));

    return async (
        params: { req: express$Request, res: express$Response, versioning: Function },
        next: Function
    ) => {
        const { req, res, versioning } = params;
        const log = debug("api:endpoint");
        log(`Trying to match an endpoint: %o`, req.url);
        const reqVersion = versioning(req);

        const versionPrefix = reqVersion !== "latest" ? "/v" + reqVersion : "";
        const reqUrl = req.url
            .replace(versionPrefix, "")
            .split("?")
            .shift();

        const urls = Object.keys(api.endpoints);
        for (let i = 0; i < urls.length; i++) {
            const baseUrl = urls[i];
            const definition = api.endpoints[baseUrl];

            if (!reqUrl.startsWith(baseUrl)) {
                continue;
            }

            const url = reqUrl.replace(baseUrl, "") || "/";
            log(`Routing endpoint %o, with URL: %o`, definition.classId, url);

            let maxVersion = definition.latest;
            if (reqVersion !== "latest") {
                maxVersion = semver.maxSatisfying(Object.keys(definition.versions), reqVersion);
            }

            if (reqVersion !== "latest" && !semver.satisfies(maxVersion, reqVersion)) {
                log(`Requested API version could not be satisfied!`);
                break;
            }

            const instance = new definition.versions[maxVersion]();
            const matchedMethod = instance.getApi().matchMethod(req.method, url);
            if (!matchedMethod) {
                break;
            }

            log("Matched %o", matchedMethod.getApiMethod().getPattern());

            try {
                await beforeApiMethodMiddleware({ req, res, matchedApiMethod: matchedMethod });
            } catch (e) {
                const ar = new ApiErrorResponse({}, e.message, e.type || "WBY_MATCHED_METHOD");
                res.status(401);
                res.setData(ar.toJSON());
                break;
            }

            log("Matched %o", matchedMethod.getApiMethod().getPattern());
            const params = matchedMethod.getParams();
            const response = await matchedMethod.getApiMethod().exec(req, res, params, instance);

            try {
                await afterApiMethodMiddleware({ matchedApiMethod: matchedMethod, response });
            } catch (e) {
                const ar = new ApiErrorResponse({}, e.message, e.type || "WBY_MATCHED_METHOD");
                res.status(401);
                res.setData(ar.toJSON());
                break;
            }

            const endpointData = response instanceof ApiResponse ? response.toJSON() : response;

            if (response instanceof ApiResponse) {
                res.status(response.getStatusCode());
            }
            res.setData(_.merge({}, res.getData(), endpointData));
            log(`Successfully fetched response!`);
        }
        next();
    };
};
