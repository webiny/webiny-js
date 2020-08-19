import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-page-builder/admin/assets/round-ballot-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { AdminMenuPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-form-builder/admin/menus");

const PageBuilderMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    const menus = identity.getPermission("pb.menus.crud");
    const categories = identity.getPermission("pb.category.crud");
    const editor = identity.getPermission("pb.page.crud");

    if (!menus && !categories && !editor) {
        return null;
    }

    return (
        <Menu name="app-page-builder" label={t`Page Builder`} icon={<PagesIcon />}>
            <Section label={t`Pages`}>
                {categories && <Item label={t`Categories`} path="/page-builder/categories" />}
                {editor && <Item label={t`Pages`} path="/page-builder/pages" />}
                {menus && <Item label={t`Menus`} path="/page-builder/menus" />}
            </Section>
        </Menu>
    );
};

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "admin-menu-page-builder",
    render(props) {
        return <PageBuilderMenu {...props} />;
    }
};

export default plugin;
