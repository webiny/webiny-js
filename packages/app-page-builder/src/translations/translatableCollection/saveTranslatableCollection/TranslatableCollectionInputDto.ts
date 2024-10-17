import { GenericRecord } from "@webiny/app/types";

export interface TranslatableCollectionInputDto {
    collectionId: string;
    items: Array<{
        itemId: string;
        value: string;
        context?: GenericRecord<string>;
    }>;
}
