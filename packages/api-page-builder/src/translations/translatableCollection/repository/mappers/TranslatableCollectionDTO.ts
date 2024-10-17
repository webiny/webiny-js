import { TranslatableItemDTO } from "./TranslatableItemDTO";

export interface TranslatableCollectionDTO {
    collectionId: string;
    items: TranslatableItemDTO[];
}
