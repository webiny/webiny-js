import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IBlockActionIfModelDisabled {
    execute(model: CmsModel): Promise<void>;
}

export const BlockActionIfModelDisabled = createAbstraction<IBlockActionIfModelDisabled>(
    "BlockActionIfModelDisabled"
);

export namespace BlockActionIfModelDisabled {
    export type Interface = IBlockActionIfModelDisabled;
}
