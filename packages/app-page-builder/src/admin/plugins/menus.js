// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-page-builder/admin/assets/round-ballot-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { getPlugins } from "@webiny/plugins";
import { SecureView } from "@webiny/app-security/components";

const t = i18n.ns("app-forms/admin/menus");

export default [
    {
        type: "menu",
        name: "menu-content",
        render({ Menu, Section, Item }: Object) {
            return (
                <SecureView
                    roles={{
                        menus: ["pb-menus"],
                        categories: ["pb-categories"],
                        editor: ["pb-editor"]
                    }}
                >
                    {({ roles }) => {
                        const { menus, categories, editor } = roles;
                        if (!menus && !categories && !editor) {
                            return null;
                        }

                        return (
                            <Menu name="content-2" label={t`Content`} icon={<PagesIcon />}>
                                <Section label={t`Pages`}>
                                    {categories && (
                                        <Item
                                            label={t`Categories`}
                                            path="/page-builder/categories"
                                        />
                                    )}
                                    {editor && <Item label={t`Pages`} path="/page-builder/pages" />}
                                    {menus && <Item label={t`Menus`} path="/page-builder/menus" />}
                                </Section>
                                {getPlugins("menu-content-section").map(plugin => (
                                    <menu-content-section key={plugin.name}>
                                        {plugin.render({ Section, Item })}
                                    </menu-content-section>
                                ))}
                            </Menu>
                        );
                    }}
                </SecureView>
            );
        }
    }
];
