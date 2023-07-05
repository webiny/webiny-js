import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";

import { ApiGateway } from "./ApiGateway";
import { CoreOutput } from "~/apps";

export type ApiCloudfront = PulumiAppModule<typeof ApiCloudfront>;

export const ApiCloudfront = createAppModule({
    name: "ApiCloudfront",
    config(app: PulumiApp) {
        const gateway = app.getModule(ApiGateway);
        const core = app.getModule(CoreOutput);


        const s3BucketAlias = "fm-bucket-olap-53c2d-hhbde8a5qrisr683xdsnrqdueuc1a--ol-s3";

        const example = new aws.cloudfront.OriginAccessControl("example", {
            description: "Example Policy",
            originAccessControlOriginType: "s3",
            signingBehavior: "always",
            signingProtocol: "sigv4",
        });

        const origin: aws.types.input.cloudfront.DistributionOrigin = {
            originId: "mujo",
            domainName: `${s3BucketAlias}.s3.eu-central-1.amazonaws.com`,
            originAccessControlId: example.id,
        };

        const distribution = app.addResource(aws.cloudfront.Distribution, {
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
                        cookies: {
                            forward: "none"
                        },
                        headers: ["Accept", "Accept-Language"],
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
                            headers: ["Accept", "Accept-Language"],
                            queryString: true
                        },
                        pathPattern: "/cms*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: gateway.api.output.name
                    },
                    {
                        pathPattern: "/files/*",
                        compress: true,
                        targetOriginId: "mujo",
                        viewerProtocolPolicy: "redirect-to-https",
                        allowedMethods: ["GET", "HEAD", "OPTIONS"],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: { forward: "none" },
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 600,
                        maxTtl: 600
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
                    origin
                ],
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none"
                    }
                },
                viewerCertificate: {
                    cloudfrontDefaultCertificate: true
                }
            }
        });

        // app.addResource(aws.s3control.ObjectLambdaAccessPointPolicy, {
        //     name: `fm-bucket-s3-object-lambda-ap-policy`,
        //     config: {
        //         policy: JSON.stringify({
        //             Version: "2008-10-17",
        //             Statement: [
        //                 {
        //                     Effect: "Allow",
        //                     Principal: {
        //                         Service: "cloudfront.amazonaws.com"
        //                     },
        //                     Action: "s3-object-lambda:Get*",
        //                     Resource:
        //                         "arn:aws:s3-object-lambda:eu-central-1:674320871285:accesspoint/fm-bucket-38f71e6-object-lambda-ap",
        //
        //                     Condition: {
        //                         StringEquals: {
        //                             "aws:SourceArn": `arn:aws:cloudfront::674320871285:distribution/E3FLE6J1PAR1CR`
        //                         }
        //                     }
        //                 }
        //             ]
        //         })
        //     }
        // });
        //
        // app.addResource(aws.s3control.ObjectLambdaAccessPointPolicy, {
        //     name: `fm-bucket-s3-ap-policy`,
        //     config: {
        //         // bucket: core.fileManagerBucketId,
        //         accessPointArn: "arn:aws:s3:eu-central-1:674320871285:accesspoint/fm-bucket-38f71e6-ap",
        //         policy: JSON.stringify({
        //             Version: "2012-10-17",
        //             Id: "default",
        //             Statement: [
        //                 {
        //                     Sid: "s3objlambda",
        //                     Effect: "Allow",
        //                     Principal: {
        //                         Service: "cloudfront.amazonaws.com"
        //                     },
        //                     Action: "s3:*",
        //                     Resource: [
        //                         // arn:${Partition}:s3:${Region}:${Account}:accesspoint/${AccessPointName}
        //                         "arn:aws:s3:eu-central-1:674320871285:accesspoint/fm-bucket-38f71e6-ap",
        //                         "arn:aws:s3:eu-central-1:674320871285:accesspoint/fm-bucket-38f71e6-ap/object/*"
        //                     ],
        //                     Condition: {
        //                         "ForAnyValue:StringEquals": {
        //                             "aws:CalledVia": "s3-object-lambda.amazonaws.com"
        //                         }
        //                     }
        //                 }
        //             ]
        //         })
        //     }
        // });
        //
        // app.addResource(aws.s3.BucketPolicy, {
        //     name: `fm-bucket-s3-policy`,
        //     config: {
        //         bucket: core.fileManagerBucketId,
        //         policy: {
        //             Version: "2012-10-17",
        //             Statement: [
        //                 {
        //                     Effect: "Allow",
        //                     Principal: {
        //                         AWS: "*"
        //                     },
        //                     Action: "*",
        //                     Resource: [
        //                         "arn:aws:s3:::fm-bucket-38f71e6",
        //                         "arn:aws:s3:::fm-bucket-38f71e6/*"
        //                     ],
        //                     Condition: {
        //                         StringEquals: {
        //                             "s3:DataAccessPointAccount": "fm-bucket-38f71e6"
        //                         }
        //                     }
        //                 }
        //             ]
        //         }
        //     }
        // });

        return distribution;
    }
});
