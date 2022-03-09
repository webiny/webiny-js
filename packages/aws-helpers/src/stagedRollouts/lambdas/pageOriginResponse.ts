import { defineLambdaEdgeResponseHandler } from "~/lambdaEdge";

import { pointsToFile, variantCookie, variantHeader } from "../utils/common";
import { getHeader, setResponseCookie } from "../utils/headers";

export const pageOriginResponse = defineLambdaEdgeResponseHandler(async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;
    const response = cf.response;

    if (pointsToFile(request.uri)) {
        return response;
    }

    if (response.status !== "200") {
        return response;
    }

    const stage = getHeader(request.headers, variantHeader);
    if (stage) {
        setResponseCookie(response, `${variantCookie}=${stage}; Secure; Path=/;`);
    }

    return response;
});
