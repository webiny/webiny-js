import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";

export const createSettingsForNewLocale = new ContextPlugin<FormBuilderContext>(context => {
    context.i18n.locales.onLocaleAfterCreate.subscribe(async ({ locale }) => {
        const currentSettings = await context.formBuilder.getSettings({
            auth: false
        });

        await context.formBuilder.createSettings({ ...currentSettings, locale: locale.code });
    });
});
