import { Identity } from "~/translations/Identity";

export interface GqlTranslatableItemDTO {
    itemId: string;
    value: string;
    modifiedOn?: string;
    modifiedBy: Identity;
}
