import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

import { ApiGateway } from "./ApiGateway.js";

export type ApiCloudfront = PulumiAppModule<typeof ApiCloudfront>;

export const ApiCloudfront = createAppModule({
    name: "ApiCloudfront",
    config(app: PulumiApp) {
        const gateway = app.getModule(ApiGateway);

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
            "X-I18n-Locale"
        ];

        return app.addResource(aws.cloudfront.Distribution, {
            name: "api-cloudfront",
            config: {
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
    }
});
