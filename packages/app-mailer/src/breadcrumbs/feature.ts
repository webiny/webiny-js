import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { MailerSettingsBreadcrumb } from "./MailerSettingsBreadcrumb.js";

export const MailerBreadcrumbsFeature = createFeature({
    name: "MailerBreadcrumbs",
    register(container: Container) {
        container.register(MailerSettingsBreadcrumb);
    }
});
