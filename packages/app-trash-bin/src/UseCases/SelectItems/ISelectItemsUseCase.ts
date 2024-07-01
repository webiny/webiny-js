import { TrashBinItem } from "~/Domain";

export interface ISelectItemsUseCase {
    execute: (items: TrashBinItem[]) => Promise<void>;
}
