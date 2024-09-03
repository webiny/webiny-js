import { Identity } from "~/translations/Identity";

export interface TranslatableItemDTO {
    itemId: string;
    value: string;
    modifiedOn: string;
    modifiedBy: Identity;
}
