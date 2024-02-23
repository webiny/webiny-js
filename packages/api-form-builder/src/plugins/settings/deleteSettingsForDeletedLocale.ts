import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";

export const deleteSettingsForDeletedLocale = new ContextPlugin<FormBuilderContext>(context => {
    context.i18n.locales.onLocaleAfterDelete.subscribe(async ({ locale }) => {
        await context.formBuilder.deleteSettings({ locale: locale.code });
    });
});
