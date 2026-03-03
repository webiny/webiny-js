import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type FeatureFlags } from "@webiny/feature-flags";

interface IGetFeatureFlags {
    execute(): Promise<FeatureFlags>;
}

export const GetFeatureFlags = createAbstraction<IGetFeatureFlags>("GetFeatureFlags");

export namespace GetFeatureFlags {
    export type Interface = IGetFeatureFlags;
}
