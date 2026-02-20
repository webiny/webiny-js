import { createAbstraction } from "@webiny/feature/api";

export interface IWcpFeatureOverrides {
    isEnabled(featureName: string): boolean;
}

export const WcpFeatureOverrides = createAbstraction<IWcpFeatureOverrides>("WcpFeatureOverrides");

export namespace WcpFeatureOverrides {
    export type Interface = IWcpFeatureOverrides;
}
