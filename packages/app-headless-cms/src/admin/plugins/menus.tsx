import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { MenuPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-headless-cms/admin/menus");

export default [
    {
        type: "menu-content-section",
        name: "menu-content-section-cms",
        render({ Section, Item }) {
            return (
                <SecureView roles={["headless-cms-editors"]}>
                    <Section label={t`Headless CMS`}>
                        <Item label={t`Content Models`} path="/cms/content-models" />
                    </Section>
                </SecureView>
            );
        }
    }
] as MenuPlugin[];
