import { Abstraction } from "@webiny/di-container";
import type { DecryptedWcpProjectLicense, ILicense } from "@webiny/wcp/types.js";

export interface IWcpGateway {
    fetchProject(): Promise<DecryptedWcpProjectLicense | null>;
}

export const WcpGateway = new Abstraction<IWcpGateway>("WcpGateway");

export namespace WcpGateway {
    export type Interface = IWcpGateway;
}

export interface IWcpService {
    getProject(): ILicense;
    isLoaded(): boolean;
    canUseFeature(featureName: string): boolean;
    loadProject(): Promise<void>;
}

export const WcpService = new Abstraction<IWcpService>("WcpService");

export namespace WcpService {
    export type Interface = IWcpService;
}
