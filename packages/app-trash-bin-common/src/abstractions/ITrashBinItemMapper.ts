import { TrashBinItemDTO } from "~/domain";

export interface ITrashBinItemMapper<TItem extends Record<string, any>> {
    toDTO: (data: TItem) => TrashBinItemDTO;
}
