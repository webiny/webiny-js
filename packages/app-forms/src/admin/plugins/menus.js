// @flow
import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";

const t = i18n.ns("app-forms/admin/menus");

export default [
    {
        type: "menu-content-section",
        name: "menu-content-section-forms",
        render({ Section, Item }: Object) {
            return (
                <SecureView roles={["forms-editors"]}>
                    <Section label={t`Forms`}>
                        <Item label={t`Forms`} path="/forms" />
                    </Section>
                </SecureView>
            );
        }
    }
];
