import {
    CreateCorePulumiAppParams,
    CreateApiPulumiAppParams,
    CreateAdminPulumiAppParams,
    CreateWebsitePulumiAppParams,
    CustomDomainParams
} from "@webiny/pulumi-aws";
import { PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi/types";

// Config.
export interface ConfigPluginParams {
    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppParam<
        | boolean
        | Partial<{
              domainName: string;
              indexPrefix: string;
          }>
    >;

    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the Core application.
     */
    vpc?: PulumiAppParam<boolean>;

    /** Custom domain configuration */
    domains?: PulumiAppParamCallback<CustomDomainParams>;

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

export class ConfigPlugin {
    params: ConfigPluginParams;
    app: null;

    constructor(params: ConfigPluginParams) {
        this.params = params;
        this.app = null;
    }
}

// Apps.

export interface AppConfigPluginParams extends ConfigPluginParams {
    beforeDeploy?: () => Promise<void>;
    afterDeploy?: () => Promise<void>;
}

// Core config.
export type CoreConfigPluginParams = AppConfigPluginParams;

export class CoreConfigPlugin {
    params: CoreConfigPluginParams;
    app: "core";

    constructor(params: CoreConfigPluginParams) {
        this.params = params;
        this.app = "core";
    }
}

// API config.
export type ApiConfigPluginParams = AppConfigPluginParams;

export class ApiConfigPlugin {
    params: ApiConfigPluginParams;
    app: "api";

    constructor(params: ApiConfigPluginParams) {
        this.params = params;
        this.app = "api";
    }
}

// Admin config.
export type AdminConfigPluginParams = AppConfigPluginParams;

export class AdminConfigPlugin {
    params: AdminConfigPluginParams;
    app: "admin";

    constructor(params: AdminConfigPluginParams) {
        this.params = params;
        this.app = "admin";
    }
}

// Website config.
export type WebsiteConfigPluginParams = AppConfigPluginParams;

export class WebsiteConfigPlugin {
    params: WebsiteConfigPluginParams;
    app: "website";

    constructor(params: WebsiteConfigPluginParams) {
        this.params = params;
        this.app = "website";
    }
}
