import { I18NLocaleItem } from "@webiny/app-i18n/types";

export interface UpgradeLocaleItem {
    locale: I18NLocaleItem;
    upgrading: boolean;
    done: boolean;
    error?: string | null;
}
