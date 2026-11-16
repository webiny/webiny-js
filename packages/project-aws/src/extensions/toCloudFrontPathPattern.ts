import { toApiGatewayPath } from "./toApiGatewayPath.js";

/**
 * `/orders/{orderId}` → `/orders/*`, the path pattern of the CloudFront behavior that routes the
 * path to the web function. Handles either parameter syntax; `{proxy+}` becomes `*` too.
 */
export function toCloudFrontPathPattern(path: string): string {
    const gatewayPath = toApiGatewayPath(path);
    return gatewayPath.replace(/\{[^}]+\}/g, "*");
}
