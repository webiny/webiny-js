import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { CorePulumiApp } from "~/pulumi/apps/core/createCorePulumiApp.js";

export interface ICorePulumi {
    execute(app: CorePulumiApp): void | Promise<void>;
}

export const CorePulumi = createAbstraction<ICorePulumi>("CorePulumi");

export namespace CorePulumi {
    export type Interface = ICorePulumi;
    export type Params = CorePulumiApp;
}
