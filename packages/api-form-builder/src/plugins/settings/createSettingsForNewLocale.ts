import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";

export const createSettingsForNewLocale = new ContextPlugin<FormBuilderContext>(context => {
    context.i18n.locales.onLocaleAfterCreate.subscribe(async ({ locale }) => {
        const existingSettings = await context.formBuilder.getSettings({
            auth: false,
            locale: locale.code
        });

        if (!existingSettings) {
            await context.formBuilder.createSettings({ locale: locale.code });
        }
    });
});
