import { TrashBinItem } from "@webiny/app-trash-bin-common";

export interface ISelectItemsController {
    execute: (entries: TrashBinItem[]) => Promise<void>;
}
