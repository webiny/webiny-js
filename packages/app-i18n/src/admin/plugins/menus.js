// @flow
import React from "react";
import { ReactComponent as I18NIcon } from "./../assets/icons/round-translate-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";

const t = i18n.ns("app-forms/admin/menus");

export default [
    {
        type: "menu",
        name: "menu-languages",
        render({ Menu, Section, Item }: Object) {
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
    }
];
