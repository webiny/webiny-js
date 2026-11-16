import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

import { ApiFileManager } from "./ApiFileManager.js";
import { ApiGateway } from "./ApiGateway.js";
import { ApiGraphqlStream } from "./ApiGraphqlStream.js";
import { ApiGraphqlWeb } from "./ApiGraphqlWeb.js";
import type { DistributionOrigin, OrderedCacheBehavior } from "./cloudfront/constants.js";
import {
    ALL_METHODS,
    API_VIEWER_HEADERS,
    FILES_ORIGIN_ID,
    FORWARD_HEADERS,
    ID_TOKEN_COOKIES
} from "./cloudfront/constants.js";
import { createStreamRouting } from "./cloudfront/createStreamRouting.js";
import { createWebRouting } from "./cloudfront/createWebRouting.js";
import { createFilesRouting } from "./cloudfront/createFilesRouting.js";
import { createGatewayRouting } from "./cloudfront/createGatewayRouting.js";
import { allowFunctionUrlInvoke } from "./cloudfront/allowFunctionUrlInvoke.js";
import { allowWebFunctionInvoke } from "./cloudfront/allowWebFunctionInvoke.js";
import { addWebRouteBehavior } from "./cloudfront/addWebRouteBehavior.js";

export type ApiCloudfront = PulumiAppModule<typeof ApiCloudfront>;

/**
 * The API's CloudFront distribution. Each origin's routing is built in `./cloudfront/`: the streaming
 * function always, then either the web function and `fm-download`, or API Gateway for projects that
 * turn the web function off.
 */
export const ApiCloudfront = createAppModule({
    name: "ApiCloudfront",
    config(app: PulumiApp) {
        const graphqlStream = app.getModule(ApiGraphqlStream);
        const fileManager = app.getModule(ApiFileManager);
        // Present unless the project sets `<Infra.Api.WebFunction enabled={false} />`.
        const graphqlWeb = app.getModule(ApiGraphqlWeb, { optional: true });
        // Present only without the web function.
        const gateway = app.getModule(ApiGateway, { optional: true });

        const stream = createStreamRouting(app, graphqlStream);

        const origins: DistributionOrigin[] = [stream.origin];
        // The routes that are not GraphQL: file delivery (`/files/*`, `/private/*` and the default
        // behavior, which serves files by alias) and, without the web function, everything else.
        let filesOriginId: pulumi.Input<string>;
        let filesForwardHeaders = FORWARD_HEADERS;
        const apiBehaviors: OrderedCacheBehavior[] = [];
        let routeCachePolicyId: pulumi.Input<string> | undefined;

        if (graphqlWeb) {
            const web = createWebRouting(app, graphqlWeb);
            routeCachePolicyId = web.routeCachePolicyId;
            origins.push(web.origin);
            apiBehaviors.push(...web.behaviors);

            const files = createFilesRouting(app, fileManager);
            origins.push(files.origin);
            filesOriginId = FILES_ORIGIN_ID;
            // An OAC signs every request to a Function URL, so `Authorization` belongs to the
            // signature. File requests authenticate with the `wby-id-token` cookie or with
            // `X-Webiny-Authorization`, which `fm-download` reads first.
            filesForwardHeaders = [...API_VIEWER_HEADERS, "X-Webiny-Authorization"];
        } else if (gateway) {
            const gatewayRouting = createGatewayRouting(gateway);
            // First, where it was before the web function existed, so projects that turn the web
            // function off see no change to the distribution.
            origins.unshift(gatewayRouting.origin);
            filesOriginId = gatewayRouting.originId;
            apiBehaviors.push(...gatewayRouting.behaviors);
        } else {
            throw new Error("The API has neither a web function nor an API Gateway to route to.");
        }

        const distribution = app.addResource(aws.cloudfront.Distribution, {
            name: "api-cloudfront",
            config: {
                httpVersion: "http2and3",
                waitForDeployment: false,
                isIpv6Enabled: true,
                enabled: true,
                defaultCacheBehavior: {
                    compress: true,
                    allowedMethods: ALL_METHODS,
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: ID_TOKEN_COOKIES,
                        headers: filesForwardHeaders,
                        queryString: true
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 0,
                    maxTtl: 86400,
                    targetOriginId: filesOriginId,
                    viewerProtocolPolicy: "allow-all"
                },
                orderedCacheBehaviors: [
                    stream.behavior,
                    ...apiBehaviors,
                    {
                        allowedMethods: ["HEAD", "GET", "OPTIONS"],
                        cachedMethods: ["HEAD", "GET", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: filesForwardHeaders,
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 2592000,
                        pathPattern: "/files/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: filesOriginId
                    },
                    {
                        allowedMethods: ["HEAD", "GET", "OPTIONS"],
                        cachedMethods: ["HEAD", "GET", "OPTIONS"],
                        forwardedValues: {
                            cookies: ID_TOKEN_COOKIES,
                            headers: filesForwardHeaders,
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 2592000,
                        pathPattern: "/private/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: filesOriginId
                    }
                ],
                origins,
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none"
                    }
                },
                viewerCertificate: {
                    cloudfrontDefaultCertificate: true
                }
            },
            opts: {
                // We are ignoring changes to the "staging" property. This is because of the following.
                // With the 5.41.0 release of Webiny, we also upgraded Pulumi to v6. This introduced a change
                // with how Cloudfront distributions are deployed, where Pulumi now also controls the new
                // `staging` property.
                // If not set, Pulumi will default it to `false`. Which is fine, but, the problem is
                // that, because this property did not exist before, it will always be considered as a change
                // upon deployment.
                // We might think this is fine, but, the problem is that a change in this property causes
                // a full replacement of the Cloudfront distribution, which is not acceptable. Especially
                // if a custom domain has already been associated with the distribution. This then would
                // require the user to disassociate the domain, wait for the distribution to be replaced,
                // and then re-associate the domain. This is not a good experience.
                ignoreChanges: ["staging"]
            }
        });

        allowFunctionUrlInvoke(app, {
            name: "graphql-stream",
            functionName: graphqlStream.functions.graphqlStream.output.name,
            distributionArn: distribution.output.arn
        });

        if (graphqlWeb) {
            allowFunctionUrlInvoke(app, {
                name: "fm-download",
                functionName: fileManager.functions.download.output.name,
                distributionArn: distribution.output.arn
            });
            allowWebFunctionInvoke(app, graphqlWeb, distribution.output.arn);
        }

        if (graphqlWeb && routeCachePolicyId) {
            const policyId = routeCachePolicyId;
            // `<Api.Route>` routes. Their `ApiPulumi` handler runs before any resource is created,
            // so the distribution's config can still change when a route arrives.
            graphqlWeb.onRoute(routePath => {
                addWebRouteBehavior(distribution, routePath, policyId);
            });
        }

        return distribution;
    }
});
