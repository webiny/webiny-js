import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";

export interface ISelectItemsController {
    execute: (items: TrashBinItemDTO[]) => Promise<void>;
}
