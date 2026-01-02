import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { CorePulumiApp } from "~/pulumi/apps/core/index.js";

export interface ICorePulumi<TApp = CorePulumiApp> {
    execute(app: TApp): void | Promise<void>;
}

export const CorePulumi = createAbstraction<ICorePulumi<CorePulumiApp>>("CorePulumi");

export namespace CorePulumi {
    export type Interface = ICorePulumi<CorePulumiApp>;
    export type Params = CorePulumiApp;
}
