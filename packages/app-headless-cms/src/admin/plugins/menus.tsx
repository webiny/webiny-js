import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useSecurity, SecureView } from "@webiny/app-security";
import { AdminMenuPlugin, AdminMenuSettingsPlugin } from "@webiny/app-admin/types";
import HeadlessCmsMenu from "./menus/HeadlessCmsMenu";
import ContentModelMenuItems from "./menus/ContentModelMenuItems";

const t = i18n.ns("app-headless-cms/admin/menus");
const ROLE_CMS_SETTINGS = ["cms.settings"];

const CmsMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    const contentModels = identity.getPermission("cms.content-model.crud");
    const contentModelGroups = identity.getPermission("cms.content-model-group.crud");

    if (!contentModels && !contentModelGroups) {
        return null;
    }

    return (
        <HeadlessCmsMenu Menu={Menu}>
            <ContentModelMenuItems Section={Section} Item={Item} />
            <Section label={t`Content Models`}>
                {contentModels && <Item label={t`Models`} path="/cms/content-models" />}

                {contentModelGroups && <Item label={t`Groups`} path="/cms/content-model-groups" />}
            </Section>
        </HeadlessCmsMenu>
    );
};

export default [
    {
        type: "admin-menu",
        name: "menu-headless-cms",
        render(props) {
            return <CmsMenu {...props} />;
        }
    } as AdminMenuPlugin,
    {
        type: "admin-menu-settings",
        name: "menu-settings-cms-environments",
        render({ Section, Item }) {
            return (
                <SecureView scopes={ROLE_CMS_SETTINGS}>
                    <Section label={t`Headless CMS`}>
                        <Item label={t`Environments`} path={"/settings/cms/environments"} />
                        <Item label={t`Aliases`} path={"/settings/cms/environments/aliases"} />
                        <Item label={t`Access Tokens`} path={"/settings/cms/accessTokens"} />
                    </Section>
                </SecureView>
            );
        }
    } as AdminMenuSettingsPlugin
];
