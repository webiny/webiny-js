import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { MenuPlugin, MenuSettingsPlugin } from "@webiny/app-admin/types";
import HeadlessCmsMenu from "./menus/HeadlessCmsMenu";
import ContentModelMenuItems from "./menus/ContentModelMenuItems";

const t = i18n.ns("app-headless-cms/admin/menus");
export default [
    {
        type: "menu",
        name: "menu-headless-cms",
        render({ Menu, Section, Item }) {
            return (
                <SecureView
                    scopes={{
                        contentModels: ["cms:contentModel:crud"],
                        contentModelGroups: ["cms:contentModelGroup:crud"]
                    }}
                >
                    {({ scopes }) => {
                        const { contentModels, contentModelGroups } = scopes;
                        if (!contentModels && !contentModelGroups) {
                            return null;
                        }

                        return (
                            <HeadlessCmsMenu Menu={Menu}>
                                <ContentModelMenuItems Section={Section} Item={Item} />
                                <Section label={t`Content Models`}>
                                    {contentModels && (
                                        <Item label={t`Models`} path="/cms/content-models" />
                                    )}

                                    {contentModelGroups && (
                                        <Item
                                            label={t`Groups`}
                                            path="/cms/content-model-groups"
                                        />
                                    )}
                                </Section>
                            </HeadlessCmsMenu>
                        );
                    }}
                </SecureView>
            );
        }
    } as MenuPlugin,
    {
        type: "menu-settings",
        name: "menu-settings-cms-environments",
        render({ Section, Item }) {
            return (
                <Section label={t`Headless CMS`}>
                    <Item label={t`Environments`} path={"/settings/cms/environments"} />
                    <Item label={t`Aliases`} path={"/settings/cms/environments/aliases"} />
                </Section>
            );
        }
    } as MenuSettingsPlugin
];
