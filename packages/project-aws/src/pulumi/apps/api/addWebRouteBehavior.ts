import type * as aws from "@pulumi/aws";
import type { PulumiAppResource } from "@webiny/pulumi";
import { WEB_ORIGIN_ID } from "./apiCloudfrontOrigins.js";

type OrderedCacheBehavior = aws.types.input.cloudfront.DistributionOrderedCacheBehavior;

/**
 * Routes one more path on the API distribution to the web function, for an `<Api.Route>`. The new
 * behavior is a copy of the `/graphql` one with a different path pattern, so it gets the same cache
 * and origin request policies, and it goes right before it.
 *
 * Runs while the distribution's config can still change: `Api.Route` registers its routes from an
 * `ApiPulumi` handler, and those run before any resource is created.
 */
export function addWebRouteBehavior(
    distribution: PulumiAppResource<typeof aws.cloudfront.Distribution>,
    routePath: string
): void {
    // API Gateway path parameters (`/orders/{orderId}`, `{proxy+}`) become CloudFront wildcards.
    const pathPattern = routePath.replace(/\{[^}]+\}/g, "*");

    distribution.config.orderedCacheBehaviors(current => {
        if (!Array.isArray(current)) {
            throw new Error(
                "The API distribution's ordered cache behaviors must be a plain array."
            );
        }

        const behaviors: OrderedCacheBehavior[] = current;
        const alreadyRouted = behaviors.some(behavior => behavior.pathPattern === pathPattern);
        if (alreadyRouted) {
            // Several methods on one path share a behavior; the router matches the method.
            return behaviors;
        }

        const graphqlIndex = behaviors.findIndex(behavior => {
            return behavior.targetOriginId === WEB_ORIGIN_ID && behavior.pathPattern === "/graphql";
        });
        if (graphqlIndex === -1) {
            throw new Error("The API distribution has no `/graphql` behavior on the web function.");
        }

        const routeBehavior = { ...behaviors[graphqlIndex], pathPattern };
        const result = [...behaviors];
        result.splice(graphqlIndex, 0, routeBehavior);
        return result;
    });
}
