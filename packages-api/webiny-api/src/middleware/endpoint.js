// @flow
import debug from "debug";
import _ from "lodash";
import semver from "semver";
import { app, ApiResponse } from "./../index";

export default async (
    params: { req: express$Request, res: express$Response, versioning: Function },
    next: Function
) => {
    const { req, res, versioning } = params;
    const log = debug("api:endpoint");
    log(`Trying to match an endpoint: %o`, req.url);
    const reqVersion = versioning(req);

    const versionPrefix = reqVersion !== "latest" ? "/v" + reqVersion : "";
    const reqUrl = req.url.replace(versionPrefix, "");

    const urls = Object.keys(app.endpoints);
    for (let i = 0; i < urls.length; i++) {
        const baseUrl = urls[i];
        const definition = app.endpoints[baseUrl];
        if (!reqUrl.startsWith(baseUrl)) {
            return;
        }

        const url = reqUrl.replace(baseUrl, "") || "/";
        log(`Routing endpoint %o, with URL: %o`, definition.classId, url);

        let maxVersion = definition.latest;
        if (reqVersion !== "latest") {
            maxVersion = semver.maxSatisfying(Object.keys(definition.versions), reqVersion);
        }

        if (reqVersion !== "latest" && !semver.satisfies(maxVersion, reqVersion)) {
            log(`Requested API version could not be satisfied!`);
            return false;
        }

        const instance = new definition.versions[maxVersion]();
        const matchedMethod = instance.getApi().matchMethod(req.method, url);
        if (!matchedMethod) {
            return;
        }

        log("Matched %o", matchedMethod.getApiMethod().getPattern());
        const params = matchedMethod.getParams();
        const result = await matchedMethod.getApiMethod().exec(req, res, params, instance);
        const endpointData = result instanceof ApiResponse ? result.toJSON() : result;

        if (result instanceof ApiResponse) {
            res.status(result.getStatusCode());
        }
        res.setData(_.merge({}, res.getData(), endpointData));
        log(`Successfully fetched response!`);
    }
    next();
};
