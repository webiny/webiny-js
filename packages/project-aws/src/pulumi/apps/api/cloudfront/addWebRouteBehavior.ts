import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiAppResource } from "@webiny/pulumi";
import { toCloudFrontPathPattern } from "~/extensions/toCloudFrontPathPattern.js";
import type { OrderedCacheBehavior } from "./constants.js";
import { WEB_ORIGIN_ID } from "./constants.js";

/**
 * Routes one more path to the web function. The new behavior is a copy of the `/graphql` one with a
 * different path pattern and the route cache policy, and it goes right before it.
 */
export function addWebRouteBehavior(
    distribution: PulumiAppResource<typeof aws.cloudfront.Distribution>,
    routePath: string,
    routeCachePolicyId: pulumi.Input<string>
): void {
    const pathPattern = toCloudFrontPathPattern(routePath);

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

        const routeBehavior = {
            ...behaviors[graphqlIndex],
            pathPattern,
            cachePolicyId: routeCachePolicyId
        };
        const result = [...behaviors];
        result.splice(graphqlIndex, 0, routeBehavior);
        return result;
    });
}
