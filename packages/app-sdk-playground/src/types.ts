import type { WebinyConfig } from "@webiny/sdk";

export interface SdkPlaygroundConfig {
    token: string;
    endpoint: string;
    tenant: string;
}

export interface SdkPlaygroundProps {
    config: WebinyConfig;
}
