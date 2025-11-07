import { Abstraction } from "@webiny/di";

export interface ICorePulumi<TApp> {
    execute(app: TApp): void | Promise<void>;
}

export const CorePulumi = new Abstraction<ICorePulumi<unknown>>("CorePulumi");

export namespace CorePulumi {
    export type Interface = ICorePulumi<unknown>;
    export type Params = unknown;
}
