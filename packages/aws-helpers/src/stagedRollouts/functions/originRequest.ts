import { defineLambdaEdgeRequestHandler, setDomainOrigin } from "~/lambdaEdge";

import { loadVariantOrigin } from "../utils/loadVariantOrigin";

export default defineLambdaEdgeRequestHandler(async event => {
    const result = await loadVariantOrigin(event);

    if ("variant" in result) {
        const cf = event.Records[0].cf;
        const request = cf.request;
        const variant = result.variant;

        setDomainOrigin(request, variant.domain);
        return request;
    }

    return result;
});
