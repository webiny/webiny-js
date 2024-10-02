import { Identity } from "~/translations/Identity";

export interface GqlTranslatableItemDTO {
    itemId: string;
    value: string;
    context?: Record<string, any>;
    modifiedOn?: string;
    modifiedBy: Identity;
}
