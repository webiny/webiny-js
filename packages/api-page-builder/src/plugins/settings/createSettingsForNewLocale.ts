import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/types";

export const createSettingsForNewLocale = new ContextPlugin<PbContext>(context => {
    context.i18n.locales.onLocaleAfterCreate.subscribe(async ({ locale }) => {
        const existingSettings = await context.pageBuilder.getSettings({
            locale: locale.code
        });

        if (!existingSettings) {
            const currentLocaleSettings = await context.pageBuilder.getSettings();
            await context.pageBuilder.updateSettings({
                ...currentLocaleSettings,
                pages: {
                    home: null,
                    notFound: null
                },
                locale: locale.code
            });
        }
    });
});
