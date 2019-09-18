// @flow
import React from "react";
import { ReactComponent as I18NIcon } from "./../assets/icons/round-translate-24px.svg";
import { hasRoles } from "@webiny/app-security";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-forms/admin/menus");

export default [
    {
        type: "menu",
        name: "menu-languages",
        render({ Menu, Section, Item }: Object) {
            const { locales }: Object = (hasRoles({
                locales: ["i18n-locales"]
            }): any);

            if (locales) {
                return (
                    <Menu name="languages" label={t`Languages`} icon={<I18NIcon />}>
                        {locales && (
                            <Section label={t`Locales`}>
                                {locales && <Item label={t`Locales`} path="/i18n/locales" />}
                            </Section>
                        )}
                    </Menu>
                );
            }

            return null;
        }
    }
];
