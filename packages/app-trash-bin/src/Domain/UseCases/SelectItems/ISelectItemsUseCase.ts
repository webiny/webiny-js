import { TrashBinItem } from "@webiny/app-trash-bin-common";

export interface ISelectItemsUseCase {
    execute: (items: TrashBinItem[]) => Promise<void>;
}
