import * as aws from "@pulumi/aws";
import { Region } from "@pulumi/aws";
import { createPulumiApp } from "@webiny/pulumi";
import { BlueGreenRouterCloudFront } from "./BlueGreenRouterCloudFront.js";
import { createCloudFrontDefaultCacheBehaviorPolicies } from "./cloudfront/createCloudFrontDefaultCacheBehaviorPolicies.js";
import { BlueGreenRouterApiGateway } from "./BlueGreenRouterApiGateway.js";
import { BlueGreenRouterCloudFrontStore } from "./BlueGreenRouterCloudFrontStore.js";
import { validateDeployments } from "./validation/validateDeployments.js";
import { getApplicationDomains } from "./domains/getApplicationDomains.js";
import { convertApplicationDomains } from "./domains/convertApplicationDomains.js";
import { resolveDomains } from "./domains/resolveDomains.js";
import { applyCustomDomain } from "~/pulumi/apps/customDomain.js";
import { attachDomainsToOutput } from "~/pulumi/apps/blueGreen/domains/attachDomainsToOutput.js";
import { BLUE_GREEN_ROUTER_STORE_KEY } from "./constants.js";
import { getProjectSdk } from "@webiny/project";
import { applyAwsResourceTags } from "~/pulumi/apps/awsUtils.js";
import { getBgDeploymentsConfigFromExtension } from "~/pulumi/apps/extensions/getBgDeploymentsConfigFromExtension.js";

export function createBlueGreenPulumiApp() {
    return createPulumiApp({
        name: "blueGreen",
        path: "apps/blueGreen",
        program: async app => {
            const sdk = await getProjectSdk();
            const projectConfig = await sdk.getProjectConfig();

            const blueGreenConfig = getBgDeploymentsConfigFromExtension(projectConfig);
            if (!blueGreenConfig) {
                throw new Error(
                    `Blue/Green deployments are not enabled. Please enable them in the project configuration.`
                );
            }

            const pulumiResourceNamePrefix = await sdk.getPulumiResourceNamePrefix();
            const deployments = validateDeployments(blueGreenConfig.deployments);

            const applicationsDomains = await getApplicationDomains({
                stacks: deployments
            });

            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            const deploymentsDomains = convertApplicationDomains({
                input: applicationsDomains
            });

            const attachedDomains = blueGreenConfig.domains;

            const domains = resolveDomains({
                attachedDomains,
                deploymentsDomains
            });
            const protect = app.env.isProduction;

            const region = new aws.Provider(Region.USEast1, {
                region: Region.USEast1
            });

            /**
             * Policies required for default Cache Behavior in CloudFront.
             * We need to do this outside the module creation because it is async.
             */
            const { forwardEverythingOriginRequestPolicyId, disableCachingCachePolicyId } =
                await createCloudFrontDefaultCacheBehaviorPolicies();
            const store = app.addModule(BlueGreenRouterCloudFrontStore, {
                protect,
                region
            });
            /**
             * TODO Maybe have switching via deployment instead of changing the key?
             * Key takes up to few minutes to propagate.
             * Deployment takes 10 seconds + 30-60 seconds for the CloudFront to propagate.
             */
            app.addResource(aws.cloudfront.KeyvaluestoreKey, {
                name: "blue-green-router-store-key",
                config: {
                    keyValueStoreArn: store.cloudFrontStore.output.arn,
                    key: BLUE_GREEN_ROUTER_STORE_KEY,
                    value: "green"
                }
            });

            const apiGateway = app.addModule(BlueGreenRouterApiGateway, {
                protect,
                region
            });

            const cloudfront = app.addModule(BlueGreenRouterCloudFront, {
                protect,
                region,
                domains,
                cachePolicyId: disableCachingCachePolicyId,
                originRequestPolicyId: forwardEverythingOriginRequestPolicyId
            });

            const domainNames = domains.reduce<string[]>((collection, domain) => {
                for (const source of domain.sources) {
                    if (collection.includes(source)) {
                        continue;
                    }
                    collection.push(source);
                }
                return collection;
            }, []);

            applyCustomDomain(cloudfront.cloudFront, {
                domains: domainNames,
                sslSupportMethod: attachedDomains.sslSupportMethod,
                acmCertificateArn: attachedDomains.acmCertificateArn
            });

            attachDomainsToOutput({
                app,
                domains,
                cloudFront: cloudfront.cloudFront
            });

            // Applies internal and user-defined AWS tags.
            await applyAwsResourceTags("blueGreen");

            return {
                region,
                cloudfront,
                apiGateway,
                store
            };
        }
    });
}
