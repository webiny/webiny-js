import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { ReactComponent as I18NIcon } from "./../assets/icons/round-translate-24px.svg";

const t = i18n.ns("app-form-builder/admin/menus");

const ROLE_I18N_LOCALES = ["i18n:locale:crud"];

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "menu-languages",
    render({ Menu, Section, Item }) {
        return (
            <SecureView scopes={ROLE_I18N_LOCALES}>
                <Menu name="languages" label={t`Languages`} icon={<I18NIcon />}>
                    <Section label={t`Locales`}>
                        <Item label={t`Locales`} path="/i18n/locales" />
                    </Section>
                </Menu>
            </SecureView>
        );
    }
};

export default plugin;
