import { TrashBinItemDTO } from "./TrashBinItem";

export interface ITrashBinItemMapper<TItem extends Record<string, any>> {
    toDTO: (data: TItem) => TrashBinItemDTO;
}
