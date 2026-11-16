import type { ApiGateway } from "../ApiGateway.js";
import type { DistributionOrigin, OrderedCacheBehavior } from "./constants.js";
import { ALL_METHODS, FORWARD_HEADERS } from "./constants.js";

/**
 * API Gateway's origin and the `/cms*` and `/wb/*` behaviors, for projects that turn the web function
 * off. API Gateway also serves files and `/graphql` there, through the default behavior.
 */
export function createGatewayRouting(gateway: ApiGateway) {
    const originId = gateway.api.output.name;

    const origin: DistributionOrigin = {
        domainName: gateway.stage.output.invokeUrl.apply((url: string) => new URL(url).hostname),
        originPath: gateway.stage.output.invokeUrl.apply((url: string) => new URL(url).pathname),
        originId,
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"]
        }
    };

    const behaviors: OrderedCacheBehavior[] = [];
    for (const pathPattern of ["/cms*", "/wb/*"]) {
        behaviors.push({
            compress: true,
            allowedMethods: ALL_METHODS,
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                cookies: {
                    forward: "none"
                },
                headers: FORWARD_HEADERS,
                queryString: true
            },
            pathPattern,
            viewerProtocolPolicy: "allow-all",
            targetOriginId: originId
        });
    }

    return { origin, originId, behaviors };
}
