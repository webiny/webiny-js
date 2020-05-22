import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-page-builder/admin/assets/round-ballot-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { getPlugins } from "@webiny/plugins";
import { SecureView } from "@webiny/app-security/components";
import { AdminMenuPlugin, AdminMenuContentSectionPlugin } from "@webiny/app-admin/types";

const t = i18n.ns("app-form-builder/admin/menus");

const ROLE_PB_MENUS = ["pb:menus:crud"];
const ROLE_PB_CATEGORIES = ["pb:category:crud"];
const ROLE_PB_EDITOR = ["pb:page:crud"];

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "menu-content",
    render({ Menu, Section, Item }) {
        return (
            <SecureView
                scopes={{
                    menus: ROLE_PB_MENUS,
                    categories: ROLE_PB_CATEGORIES,
                    editor: ROLE_PB_EDITOR
                }}
            >
                {({ scopes }) => {
                    const { menus, categories, editor } = scopes;
                    if (!menus && !categories && !editor) {
                        return null;
                    }

                    return (
                        <Menu name="content-2" label={t`Content`} icon={<PagesIcon />}>
                            <Section label={t`Pages`}>
                                {categories && (
                                    <Item label={t`Categories`} path="/page-builder/categories" />
                                )}
                                {editor && <Item label={t`Pages`} path="/page-builder/pages" />}
                                {menus && <Item label={t`Menus`} path="/page-builder/menus" />}
                            </Section>
                            {getPlugins("admin-menu-content-section").map(
                                (plugin: AdminMenuContentSectionPlugin) => (
                                    <React.Fragment key={plugin.name}>
                                        {plugin.render({ Section, Item })}
                                    </React.Fragment>
                                )
                            )}
                        </Menu>
                    );
                }}
            </SecureView>
        );
    }
};

export default plugin;
