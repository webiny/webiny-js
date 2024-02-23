import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/types";

export const deleteSettingsForDeletedLocale = new ContextPlugin<PbContext>(context => {
    context.i18n.locales.onLocaleAfterDelete.subscribe(async ({ locale }) => {
        await context.pageBuilder.deleteSettings({ locale: locale.code });
    });
});
