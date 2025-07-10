import * as aws from "@pulumi/aws";
import { Region } from "@pulumi/aws";
import type { PulumiAppParam } from "@webiny/pulumi";
import { createPulumiApp } from "@webiny/pulumi";
import { DEFAULT_PROD_ENV_NAMES } from "~/constants.js";
import { BlueGreenRouterCloudFront } from "./BlueGreenRouterCloudFront.js";
import { createCloudFrontDefaultCacheBehaviorPolicies } from "./cloudfront/createCloudFrontDefaultCacheBehaviorPolicies.js";
import { tagResources } from "~/utils/tagResources.js";
import { getEnvVariableWebinyProjectName } from "~/env/projectName.js";
import { getEnvVariableWebinyEnv } from "~/env/env.js";
import { BlueGreenRouterApiGateway } from "./BlueGreenRouterApiGateway.js";
import { BlueGreenRouterCloudFrontStore } from "./BlueGreenRouterCloudFrontStore.js";
import type { IAttachDomainsCallable, IBlueGreenDeployment } from "./types.js";
import { validateDeployments } from "./validation/validateDeployments.js";
import { getApplicationDomains } from "./domains/getApplicationDomains.js";
import { convertApplicationDomains } from "./domains/convertApplicationDomains.js";
import { resolveDomains } from "./domains/resolveDomains.js";
import { applyCustomDomain } from "~/apps/customDomain.js";
import { attachDomainsToOutput } from "~/apps/blueGreen/domains/attachDomainsToOutput.js";
import { BLUE_GREEN_ROUTER_STORE_KEY } from "./constants.js";

export type BlueGreenRouterPulumiApp = ReturnType<typeof createBlueGreenPulumiApp>;

export interface ElasticsearchConfig {
    domainName: string;
    indexPrefix: string;
    sharedIndexes: boolean;
}

export interface OpenSearchConfig {
    domainName: string;
    indexPrefix: string;
    sharedIndexes: boolean;
}

export interface IDeploymentsCallableParams {
    env: string;
}

export interface IDeploymentsCallable {
    (params: IDeploymentsCallableParams): [IBlueGreenDeployment, IBlueGreenDeployment];
}

export interface CreateBlueGreenPulumiAppParams {
    /**
     * Secures against deleting database by accident.
     * By default enabled in production environments.
     */
    protect?: PulumiAppParam<boolean>;

    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppParam<boolean | Partial<ElasticsearchConfig>>;

    /**
     * Enables OpenSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    openSearch?: PulumiAppParam<boolean | Partial<OpenSearchConfig>>;

    /**
     * Enables VPC for the application.
     * By default enabled in production environments.
     */
    vpc?: PulumiAppParam<boolean>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: BlueGreenRouterPulumiApp) => void | Promise<void>;

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
    /**
     * Available deployments for the Blue / Green switch.
     * They will be validated before deploy.
     */
    deployments: IDeploymentsCallable;
    /**
     * Attach domains to the Blue/Green CloudFront.
     */
    domains: IAttachDomainsCallable;
}

export function createBlueGreenPulumiApp(projectAppParams: CreateBlueGreenPulumiAppParams) {
    return createPulumiApp({
        name: "blueGreen",
        path: "apps/blueGreen",
        config: projectAppParams,
        program: async app => {
            const productionEnvironments =
                app.params.create.productionEnvironments || DEFAULT_PROD_ENV_NAMES;

            const deployments = validateDeployments(projectAppParams.deployments(app.params.run));

            const applicationsDomains = await getApplicationDomains({
                stacks: deployments
            });

            const deploymentsDomains = convertApplicationDomains({
                input: applicationsDomains
            });

            const attachedDomains = projectAppParams.domains(app.params.run);

            const domains = resolveDomains({
                attachedDomains,
                deploymentsDomains
            });
            const isProduction = productionEnvironments.includes(app.params.run.env);
            const protect = app.getParam(projectAppParams.protect) ?? isProduction;

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

            tagResources({
                WebAppName: "blueGreenRouter",
                WbyProjectName: getEnvVariableWebinyProjectName(),
                WbyEnvironment: getEnvVariableWebinyEnv()
            });

            return {
                region,
                cloudfront,
                apiGateway,
                store
            };
        }
    });
}
