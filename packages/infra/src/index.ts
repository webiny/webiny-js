import {
    CreateCorePulumiAppParams,
    CreateApiPulumiAppParams,
    CreateAdminPulumiAppParams,
    CreateWebsitePulumiAppParams,
    CustomDomainParams
} from "@webiny/pulumi-aws";
import { PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi/types";

// Config.
export interface ConfigParams {
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

export class Config {
    params: ConfigParams;
    app: null;

    constructor(params: ConfigParams) {
        this.params = params;
        this.app = null;
    }
}

// Apps.

export interface AppConfigParams extends ConfigParams {
    beforeDeploy?: () => Promise<void>;
    afterDeploy?: () => Promise<void>;
}

// Core config.
export type CoreConfigParams = AppConfigParams;

export class CoreConfig {
    params: CoreConfigParams;
    app: "core";

    constructor(params: CoreConfigParams) {
        this.params = params;
        this.app = "core";
    }
}

// API config.
export type ApiConfigParams = AppConfigParams;

export class ApiConfig {
    params: ApiConfigParams;
    app: "api";

    constructor(params: ApiConfigParams) {
        this.params = params;
        this.app = "api";
    }
}

// Admin config.
export type AdminConfigParams = AppConfigParams;

export class AdminConfig {
    params: AdminConfigParams;
    app: "admin";

    constructor(params: AdminConfigParams) {
        this.params = params;
        this.app = "admin";
    }
}

// Website config.
export type WebsiteConfigParams = AppConfigParams;

export class WebsiteConfig {
    params: WebsiteConfigParams;
    app: "website";

    constructor(params: WebsiteConfigParams) {
        this.params = params;
        this.app = "website";
    }
}
