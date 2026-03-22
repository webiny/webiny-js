import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface ICorePulumi<TApp> {
    execute(app: TApp): void | Promise<void>;
}

/**
 * Implement this abstraction to add custom Pulumi code to Core.
 */
export const CorePulumi = createAbstraction<ICorePulumi<unknown>>("CorePulumi");

export namespace CorePulumi {
    export type Interface = ICorePulumi<unknown>;
    export type Params = unknown;
}
