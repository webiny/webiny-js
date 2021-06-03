import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security";
import { MenuPlugin } from "@webiny/app-admin/plugins/MenuPlugin";
import { ReactComponent as I18NIcon } from "../assets/icons/round-translate-24px.svg";

const t = i18n.ns("app-form-builder/admin/menus");

export default new MenuPlugin({
    render({ Menu, Section, Item }) {
        return (
            <SecureView permission={"i18n.locale"}>
                <Menu name="languages" label={t`Languages`} icon={<I18NIcon />}>
                    <Section label={t`Locales`}>
                        <Item label={t`Locales`} path="/i18n/locales" />
                    </Section>
                </Menu>
            </SecureView>
        );
    }
});
