import type { WebinyConfig } from "./types.js";
import { CmsSdk } from "./CmsSdk.js";
import { TenantManagerSdk } from "./TenantManagerSdk.js";

export class Webiny {
    public readonly cms: CmsSdk;
    public readonly tenantManager: TenantManagerSdk;

    constructor(config: WebinyConfig) {
        this.cms = new CmsSdk({
            ...config,
            tenant: config.tenant || "root"
        });
        this.tenantManager = new TenantManagerSdk({
            ...config,
            tenant: config.tenant || "root"
        });
    }
}

// Backward compatibility exports.
export { Webiny as Sdk };
export type { WebinyConfig as SdkConfig };
