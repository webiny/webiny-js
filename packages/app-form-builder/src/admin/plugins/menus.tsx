import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { MenuContentSectionPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-form-builder/admin/menus");

export default [
    {
        type: "menu-content-section",
        name: "menu-content-section-forms",
        render({ Section, Item }) {
            return (
                <SecureView roles={["forms-editors"]}>
                    <Section label={t`Form Builder`}>
                        <Item label={t`Form Builder`} path="/forms" />
                    </Section>
                </SecureView>
            );
        }
    }
] as MenuContentSectionPlugin[];
