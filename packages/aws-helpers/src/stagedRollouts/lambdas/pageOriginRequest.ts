import { defineLambdaEdgeRequestHandler } from "~/lambdaEdge";

import { stageCookie, stageHeader } from "../utils/common";
import { isConfigRequest, loadConfig } from "../utils/config";
import {
    getHeader,
    redirectResponse,
    setResponseCookie,
    getRequestCookies
} from "../utils/headers";
import { setDomainOrigin } from "../utils/origin";

export const pageOriginRequest = defineLambdaEdgeRequestHandler(async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;

    if (isConfigRequest(request)) {
        // requesting the config file, pass it through
        return request;
    }

    let stageName = getHeader(request.headers, stageHeader);
    let stageFromCookie = false;

    if (!stageName) {
        stageName = getRequestCookies(request)[stageCookie];
        stageFromCookie = true;
    }

    if (!stageName) {
        // Stage is not set, just let it pass.
        return request;
    }

    const config = await loadConfig(event);
    const stageConfig = config[stageName];
    if (!stageConfig) {
        if (stageFromCookie) {
            // If stage is invalid, we should make a redirect,
            // clearing out any sticky cookie user may have.
            const response = redirectResponse({
                url: request.uri,
                query: request.querystring
            });

            setResponseCookie(response, `${stageCookie}=; Secure; Path=/;`);
            return response;
        } else {
            // Do not make a redirect for stage selected with header,
            // because this will lead to infinite redirects.
            return {
                status: "404",
                body: `No stage ${stageName} found`
            };
        }
    }

    console.log(`Forwarding to ${stageConfig.domain}`);

    setDomainOrigin(request, stageConfig.domain);

    return request;
});
