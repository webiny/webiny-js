import type { CmsSdkConfig } from "./types.js";
import { CmsSdk } from "./CmsSdk.js";

export type WebinyConfig = CmsSdkConfig;

export class Webiny {
    public readonly cms: CmsSdk;

    constructor(config: WebinyConfig) {
        this.cms = new CmsSdk(config);
    }
}

// Backward compatibility exports.
export { Webiny as Sdk };
export type { WebinyConfig as SdkConfig };
