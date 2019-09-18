// @flow
import React from "react";
import { hasRoles } from "@webiny/app-security";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-forms/admin/menus");

export default [
    {
        type: "menu-app-page-builder-section",
        name: "menu-app-page-builder-section-forms",
        render({ Section, Item }: Object) {
            const { forms }: Object = (hasRoles({
                forms: ["form-editors"]
            }): any);

            if (forms) {
                return (
                    <Section label={t`Forms`}>
                        <Item label={t`Forms`} path="/forms" />
                    </Section>
                );
            }

            return null;
        }
    }
];
