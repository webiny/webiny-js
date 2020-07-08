import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-page-builder/admin/assets/round-ballot-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { AdminMenuPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-form-builder/admin/menus");
const ROLE_FORMS_EDITOR = ["forms:form:crud"];

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "admin-menu-form-builder",
    render({ Menu, Section, Item }) {
        return (
            <SecureView
                scopes={{
                    forms: ROLE_FORMS_EDITOR
                }}
            >
                {({ scopes }) => {
                    const { forms } = scopes;
                    if (!forms) {
                        return null;
                    }

                    return (
                        <Menu name="app-form-builder" label={t`Form Builder`} icon={<PagesIcon />}>
                            <Section label={t`Forms`}>
                                {forms && <Item label={t`Forms`} path="/forms" />}
                            </Section>
                        </Menu>
                    );
                }}
            </SecureView>
        );
    }
};

export default plugin;
