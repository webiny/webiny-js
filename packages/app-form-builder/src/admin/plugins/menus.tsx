import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-page-builder/admin/assets/round-ballot-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { useSecurity } from "@webiny/app-security";

const t = i18n.ns("app-form-builder/admin/menus");

const FormBuilderMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    if (!identity.getPermission("forms.form.crud")) {
        return null;
    }

    return (
        <Menu name="app-form-builder" label={t`Form Builder`} icon={<PagesIcon />}>
            <Section label={t`Forms`}>{<Item label={t`Forms`} path="/forms" />}</Section>
        </Menu>
    );
};

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "admin-menu-form-builder",
    render(props) {
        return <FormBuilderMenu {...props} />;
    }
};

export default plugin;
