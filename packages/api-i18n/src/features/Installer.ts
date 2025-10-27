import { AppInstaller } from "@webiny/api-tenancy/features/InstallTenant";
import type { I18NContext, I18NLocale } from "~/types.js";

export class I18nInstaller implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "I18n";
    readonly dependsOn = [];
    private createdLocale: I18NLocale | undefined;

    constructor(private i18n: I18NContext["i18n"]) {}

    async install(): Promise<void> {
        await this.i18n.locales.createLocale({ code: "en-US", default: true });
    }

    async uninstall(): Promise<void> {
        if (this.createdLocale) {
            await this.i18n.locales.deleteLocale(this.createdLocale.code);
        }
    }
}
