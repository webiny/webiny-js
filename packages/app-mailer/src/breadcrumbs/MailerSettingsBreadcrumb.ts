import { createImplementation } from "@webiny/di";
import { Breadcrumb, type BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Breadcrumb trail for the Mailer settings page: `Settings › Mailer`. Purely declarative —
 * no React in the view. The home entry is prepended by the header.
 */
class MailerSettingsBreadcrumb implements Breadcrumb.Interface {
    name = "mailer.settings";
    route = Routes.Settings;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Settings" }, { label: "Mailer" }];
    }
}

export const mailerSettingsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: MailerSettingsBreadcrumb,
    dependencies: []
});
