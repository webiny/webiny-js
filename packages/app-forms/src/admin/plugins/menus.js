// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-forms/admin/icons/round-ballot-24px.svg";
import { hasRoles } from "@webiny/app-security";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-forms/admin/menus");

export default [
    {
        name: "menu-app-forms",
        type: "menu",
        render({ Menu, Section, Item }: Object) {
            const { forms }: Object = (hasRoles({
                forms: ["form-editors"]
            }): any);

            if (forms) {
                return (
                    <Menu name="content" label={t`Content`} icon={<PagesIcon />}>
                        <Section label={t`Forms`}>
                            <Item label={t`Forms`} path="/forms" />
                        </Section>
                    </Menu>
                );
            }

            return null;
        }
    }
];
