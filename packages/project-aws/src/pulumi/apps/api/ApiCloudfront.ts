import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

import { ApiGateway } from "./ApiGateway.js";
import { ApiGraphqlStream } from "./ApiGraphqlStream.js";

export type ApiCloudfront = PulumiAppModule<typeof ApiCloudfront>;

const STREAM_ORIGIN_ID = "graphql-stream-function-url";

export const ApiCloudfront = createAppModule({
    name: "ApiCloudfront",
    config(app: PulumiApp) {
        const gateway = app.getModule(ApiGateway);
        const graphqlStream = app.getModule(ApiGraphqlStream);

        const cookies = {
            forward: "whitelist",
            whitelistedNames: ["wby-id-token"]
        };

        const forwardHeaders = [
            "Origin",
            "Authorization",
            "Accept",
            "Accept-Language",
            "X-Tenant",
            "X-Webiny-Sdk"
        ];

        // Lets CloudFront sign requests to the Lambda Function URL with SigV4, so the URL itself can
        // stay on AWS_IAM authorization instead of being reachable from the internet.
        const streamOac = app.addResource(aws.cloudfront.OriginAccessControl, {
            name: "api-stream-oac",
            config: {
                description: "Signs CloudFront requests to the streaming Lambda Function URL",
                originAccessControlOriginType: "lambda",
                signingBehavior: "always",
                signingProtocol: "sigv4"
            }
        });

        const distribution = app.addResource(aws.cloudfront.Distribution, {
            name: "api-cloudfront",
            config: {
                httpVersion: "http2and3",
                waitForDeployment: false,
                isIpv6Enabled: true,
                enabled: true,
                defaultCacheBehavior: {
                    compress: true,
                    allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies,
                        headers: forwardHeaders,
                        queryString: true
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 0,
                    maxTtl: 86400,
                    targetOriginId: gateway.api.output.name,
                    viewerProtocolPolicy: "allow-all"
                },
                orderedCacheBehaviors: [
                    {
                        // Streaming routes (SSE). Must come before the other behaviors so `/stream/*`
                        // never falls through to the API Gateway origin, which cannot stream.
                        //
                        // `compress: false` is load-bearing: CloudFront compression buffers small
                        // chunks, which defeats incremental delivery even though the origin streams.
                        compress: false,
                        allowedMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "POST",
                            "PATCH",
                            "DELETE"
                        ],
                        cachedMethods: ["GET", "HEAD"],
                        forwardedValues: {
                            cookies,
                            // `Authorization` is deliberately absent: OAC signing puts SigV4 in that
                            // header, so a viewer token there could not survive. Clients send the
                            // token in `X-Webiny-Authorization` instead, which both the AWS and the
                            // self-hosted identity extractors read first.
                            headers: [
                                "Origin",
                                "Accept",
                                "Accept-Language",
                                "X-Tenant",
                                "X-Webiny-Sdk",
                                "X-Webiny-Authorization"
                            ],
                            queryString: true
                        },
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 0,
                        pathPattern: "/stream/*",
                        viewerProtocolPolicy: "https-only",
                        targetOriginId: STREAM_ORIGIN_ID
                    },
                    {
                        compress: true,
                        allowedMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "POST",
                            "PATCH",
                            "DELETE"
                        ],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: forwardHeaders,
                            queryString: true
                        },
                        pathPattern: "/cms*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: gateway.api.output.name
                    },
                    {
                        compress: true,
                        allowedMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "POST",
                            "PATCH",
                            "DELETE"
                        ],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: forwardHeaders,
                            queryString: true
                        },
                        pathPattern: "/wb/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: gateway.api.output.name
                    },
                    {
                        allowedMethods: ["HEAD", "GET", "OPTIONS"],
                        cachedMethods: ["HEAD", "GET", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: forwardHeaders,
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 2592000,
                        pathPattern: "/files/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: gateway.api.output.name
                    },
                    {
                        allowedMethods: ["HEAD", "GET", "OPTIONS"],
                        cachedMethods: ["HEAD", "GET", "OPTIONS"],
                        forwardedValues: {
                            cookies: cookies,
                            headers: forwardHeaders,
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 2592000,
                        pathPattern: "/private/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: gateway.api.output.name
                    }
                ],
                origins: [
                    {
                        domainName: gateway.stage.output.invokeUrl.apply(
                            (url: string) => new URL(url).hostname
                        ),
                        originPath: gateway.stage.output.invokeUrl.apply(
                            (url: string) => new URL(url).pathname
                        ),
                        originId: gateway.api.output.name,
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originProtocolPolicy: "https-only",
                            originSslProtocols: ["TLSv1.2"]
                        }
                    },
                    {
                        // Lambda Function URL origin for streaming routes. A Function URL is a plain
                        // HTTPS endpoint, hence customOriginConfig; the OAC is what makes CloudFront
                        // sign the request so the URL can require AWS_IAM.
                        domainName: graphqlStream.functionUrlDomain,
                        originId: STREAM_ORIGIN_ID,
                        originAccessControlId: streamOac.output.id,
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originProtocolPolicy: "https-only",
                            originSslProtocols: ["TLSv1.2"]
                        }
                    }
                ],
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

        // Allows THIS distribution — and nothing else — to invoke the streaming Function URL. Created
        // after the distribution because it needs its ARN; the Function URL is useless until it exists.
        app.addResource(aws.lambda.Permission, {
            name: "graphql-stream-url-cloudfront-invoke",
            config: {
                action: "lambda:InvokeFunctionUrl",
                function: graphqlStream.functions.graphqlStream.output.name,
                principal: "cloudfront.amazonaws.com",
                sourceArn: distribution.output.arn,
                functionUrlAuthType: "AWS_IAM",
                statementId: "allow-cloudfront-invoke-function-url"
            }
        });

        return distribution;
    }
});
