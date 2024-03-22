import { TrashBinItem } from "@webiny/app-trash-bin-common";

export interface ISelectItemsController {
    execute: (items: TrashBinItem[]) => Promise<void>;
}
