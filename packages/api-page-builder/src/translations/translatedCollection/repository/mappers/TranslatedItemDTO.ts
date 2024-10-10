import { Identity } from "~/translations/Identity";

export interface TranslatedItemDTO {
    itemId: string;
    value?: string;
    translatedOn?: string;
    translatedBy?: Identity;
}
