import { TrashBinItemDTO } from "~/Domain";

export interface ISelectItemsController {
    execute: (items: TrashBinItemDTO[]) => Promise<void>;
}
