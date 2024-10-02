import { Identity } from "~/translations/Identity";

export interface TranslatableItemDTO {
    itemId: string;
    value: string;
    context: Record<string, any> | undefined;
    modifiedOn: string;
    modifiedBy: Identity;
}
