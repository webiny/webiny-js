import { defineLambdaEdgeResponseHandler } from "@webiny/aws-helpers";

import { pointsToFile, stageCookie, stageHeader } from "../utils/common";
import { getHeader, setResponseCookie } from "../utils/headers";

export default defineLambdaEdgeResponseHandler(async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;
    const response = cf.response;

    if (pointsToFile(request.uri)) {
        return response;
    }

    if (response.status !== "200") {
        return response;
    }

    const stage = getHeader(request.headers, stageHeader);
    if (stage) {
        setResponseCookie(response, `${stageCookie}=${stage}; Secure; Path=/;`);
    }

    return response;
});
