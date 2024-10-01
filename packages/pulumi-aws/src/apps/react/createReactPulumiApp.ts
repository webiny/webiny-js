import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createPulumiApp, PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi";
import { addDomainsUrlsOutputs, tagResources } from "~/utils";
import { createPrivateAppBucket } from "../createAppBucket";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import { withServiceManifest } from "~/utils/withServiceManifest";
import { ApiOutput, CoreOutput } from "~/apps";

export type ReactPulumiApp = ReturnType<typeof createReactPulumiApp>;

export interface CreateReactPulumiAppParams {
    /**
     * A name of the app, e.g., "user-area"
     */
    name: string;

    /**
     * A folder where the app is located, e.g., "apps/user-area"
     */
    folder: string;

    /** Custom domain configuration */
    domains?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReactPulumiApp) => void | Promise<void>;

    /**
     * Prefixes names of all Pulumi cloud infrastructure resource with given prefix.
     */
    pulumiResourceNamePrefix?: PulumiAppParam<string>;

    /**
     * Treats provided environments as production environments, which
     * are deployed in production deployment mode.
     * https://www.webiny.com/docs/architecture/deployment-modes/production
     */
    productionEnvironments?: PulumiAppParam<string[]>;
}

export const createReactPulumiApp = (projectAppParams: CreateReactPulumiAppParams) => {
    const app = createPulumiApp({
        name: projectAppParams.name,
        path: projectAppParams.folder,
        config: projectAppParams,
        program: async app => {
            const pulumiResourceNamePrefix = app.getParam(
                projectAppParams.pulumiResourceNamePrefix
            );
            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            const { name } = projectAppParams;

            // Register core output as a module available for all other modules
            const core = app.addModule(CoreOutput);
            app.addModule(ApiOutput);

            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as unknown as ReactPulumiApp);
                });
            }

            const bucket = createPrivateAppBucket(app, `${name}-app`);

            const cloudfront = app.addResource(aws.cloudfront.Distribution, {
                name: `${name}-app-cdn`,
                config: {
                    enabled: true,
                    waitForDeployment: false,
                    origins: [bucket.origin],
                    defaultRootObject: "index.html",
                    defaultCacheBehavior: {
                        compress: true,
                        targetOriginId: bucket.origin.originId,
                        viewerProtocolPolicy: "redirect-to-https",
                        allowedMethods: ["GET", "HEAD", "OPTIONS"],
                        cachedMethods: ["GET", "HEAD", "OPTIONS"],
                        forwardedValues: {
                            cookies: { forward: "none" },
                            queryString: false
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 600,
                        maxTtl: 600
                    },
                    priceClass: "PriceClass_100",
                    customErrorResponses: [
                        { errorCode: 404, responseCode: 404, responsePagePath: "/index.html" }
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

            const domains = app.getParam(projectAppParams.domains);
            if (domains) {
                applyCustomDomain(cloudfront, domains);
            }

            app.addOutput("appStorage", bucket.bucket.output.id);

            app.addHandler(() => {
                addDomainsUrlsOutputs({
                    app,
                    cloudfrontDistribution: cloudfront,
                    map: {
                        distributionDomain: "cloudfrontAppDomain",
                        distributionUrl: "cloudfrontAppUrl",
                        usedDomain: "appDomain",
                        usedUrl: "appUrl"
                    }
                });
            });

            tagResources({
                WbyAppName: name,
                WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
                WbyEnvironment: String(process.env["WEBINY_ENV"])
            });

            /**
             * We need to store the appUrl to the admin settings item in the dynamodb
             */
            app.addResource(aws.dynamodb.TableItem, {
                name: "adminSettings",
                config: {
                    tableName: core.primaryDynamodbTableName,
                    hashKey: core.primaryDynamodbTableHashKey,
                    rangeKey: pulumi
                        .output(core.primaryDynamodbTableRangeKey)
                        .apply(key => key || "SK"),
                    item: pulumi.interpolate`{
                          "PK": {"S": "ADMIN#SETTINGS"},
                          "SK": {"S": "${app.params.run.variant || "default"}"},
                          "data": {
                            "M": {
                              "appUrl": {
                                "S": "${cloudfront.output.domainName.apply(
                                    value => `https://${value}`
                                )}"
                              }
                            }
                          }
                        }`
                }
            });

            return {
                ...bucket,
                cloudfront
            };
        }
    });

    return withServiceManifest(app);
};
