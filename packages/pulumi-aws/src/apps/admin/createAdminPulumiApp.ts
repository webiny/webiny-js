import { PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi";
import { createReactPulumiApp, CustomDomainParams } from "~/apps";

export type AdminPulumiApp = ReturnType<typeof createReactPulumiApp>;

export interface CreateAdminPulumiAppParams {
    /** Custom domain configuration */
    domains?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: AdminPulumiApp) => void | Promise<void>;

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

export const createAdminPulumiApp = (projectAppParams: CreateAdminPulumiAppParams) => {
    return createReactPulumiApp({
        name: "admin",
        folder: "apps/admin",
        ...projectAppParams
    });
};
