import { Plugin } from "@webiny/plugins";
import { Settings } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";

export interface BeforeInstallParams {
    tenant: Tenant;
    settings: Partial<Settings>;
}
export interface AfterInstallParams {
    tenant: Tenant;
    settings: Settings;
}

export interface Params {
    beforeInstall?: (params: BeforeInstallParams) => Promise<void>;
    afterInstall?: (params: AfterInstallParams) => Promise<void>;
}

export class FormBuilderSystemPlugin extends Plugin {
    private readonly params: Params;

    public constructor(params: Params) {
        super();
        this.params = params;
    }

    public async beforeInstall(params: BeforeInstallParams): Promise<void> {
        if (!this.params.beforeInstall) {
            return;
        }
        await this.params.beforeInstall(params);
    }

    public async afterInstall(params: AfterInstallParams): Promise<void> {
        if (!this.params.afterInstall) {
            return;
        }
        await this.params.afterInstall(params);
    }
}
