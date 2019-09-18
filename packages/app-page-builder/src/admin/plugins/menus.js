// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-page-builder/admin/assets/round-ballot-24px.svg";
import { hasRoles } from "@webiny/app-security";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-forms/admin/menus");
import { getPlugins } from "@webiny/plugins";

export default [
    {
        type: "menu",
        name: "menu-content",
        render({ Menu, Section, Item }: Object) {
            const { menus, categories, editor }: Object = (hasRoles({
                menus: ["pb-menus"],
                categories: ["pb-categories"],
                editor: ["pb-editor"]
            }): any);

            if (menus || categories || editor) {
                const additionalSectionPlugins = getPlugins("menu-content-section");
                return (
                    <Menu name="content-2" label={t`Content`} icon={<PagesIcon />}>
                        <Section label={t`Pages`}>
                            {categories && (
                                <Item label={t`Categories`} path="/page-builder/categories" />
                            )}
                            {editor && <Item label={t`Pages`} path="/page-builder/pages" />}
                            {menus && <Item label={t`Menus`} path="/page-builder/menus" />}
                        </Section>
                        {additionalSectionPlugins.map(plugin => (
                            <menu-content-section key={plugin.name}>
                                {plugin.render({ Section, Item })}
                            </menu-content-section>
                        ))}
                    </Menu>
                );
            }

            return null;
        }
    }
];
