import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { MenuPlugin } from "@webiny/app-admin/types";
import { ReactComponent as I18NIcon } from "./../assets/icons/round-translate-24px.svg";

const t = i18n.ns("app-form-builder/admin/menus");

const plugin: MenuPlugin = {
    type: "menu",
    name: "menu-languages",
    render({ Menu, Section, Item }) {
        return (
            <SecureView roles={["i18n-locales"]}>
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
