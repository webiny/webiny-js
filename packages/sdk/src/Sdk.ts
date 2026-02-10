import type { CmsSdkConfig } from "./types.js";
import { CmsSdk } from "./CmsSdk.js";

export interface SdkConfig {
    cms: CmsSdkConfig;
}

export class Sdk {
    public readonly cms: CmsSdk;

    constructor(config: SdkConfig) {
        this.cms = new CmsSdk(config.cms);
    }
}
