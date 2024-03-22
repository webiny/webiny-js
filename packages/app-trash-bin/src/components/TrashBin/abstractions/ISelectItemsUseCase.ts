import { TrashBinItem } from "@webiny/app-trash-bin-common";

export interface ISelectItemsUseCase {
    execute: (entries: TrashBinItem[]) => Promise<void>;
}
