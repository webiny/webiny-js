import { defineLambdaEdgeRequestHandler, setDomainOrigin } from "~/lambdaEdge";

import { pointsToFile } from "../utils/common";
import { loadOriginPage } from "../utils/loadOriginPage";
import { loadVariantOrigin } from "../utils/loadVariantOrigin";

export default defineLambdaEdgeRequestHandler(async event => {
    try {
        const result = await loadVariantOrigin(event);

        if ("variant" in result) {
            const cf = event.Records[0].cf;
            const request = cf.request;
            const variant = result.variant;

            // For file requests we just pass the request to proper origin.
            if (pointsToFile(request.uri)) {
                setDomainOrigin(request, variant.domain);
                return request;
            }

            // For pages we make a custom HTTP request to the origin and transform page properly.
            // For example we change asset URLs to be absolute.
            return await loadOriginPage(variant.domain, request.uri);
        }
        return result;
    } catch (e) {
        console.error(e);
        throw e;
    }
});
