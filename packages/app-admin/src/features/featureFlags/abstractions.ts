import { Abstraction } from "@webiny/di";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";
import { FeatureFlags } from "@webiny/feature-flags";

export interface IFeatureFlagsGateway {
    fetchFlags(): Promise<IFeatureFlagsDto | null>;
}

export const FeatureFlagsGateway = new Abstraction<IFeatureFlagsGateway>("FeatureFlagsGateway");

export namespace FeatureFlagsGateway {
    export type Interface = IFeatureFlagsGateway;
}

export interface IFeatureFlagsService {
    getFlags(): FeatureFlags;
    isLoaded(): boolean;
    loadFlags(): Promise<void>;
}

export const FeatureFlagsService = new Abstraction<IFeatureFlagsService>("FeatureFlagsService");

export namespace FeatureFlagsService {
    export type Interface = IFeatureFlagsService;
}
