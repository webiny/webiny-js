import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { AdminMenuContentSectionPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-form-builder/admin/menus");

const ROLE_FORMS_EDITOR = ["forms:settings"];

export default [
    {
        type: "admin-menu-content-section",
        name: "menu-content-section-forms",
        render({ Section, Item }) {
            return (
                <SecureView scopes={ROLE_FORMS_EDITOR}>
                    <Section label={t`Form Builder`}>
                        <Item label={t`Forms`} path="/forms" />
                    </Section>
                </SecureView>
            );
        }
    }
] as AdminMenuContentSectionPlugin[];
