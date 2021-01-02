import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import HeadlessCmsMenu from "./menus/HeadlessCmsMenu";
import ContentModelMenuItems from "./menus/ContentModelMenuItems";

const t = i18n.ns("app-headless-cms/admin/menus");

const CmsMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    const contentModels = identity.getPermission("cms.contentModel");
    const contentModelGroups = identity.getPermission("cms.contentModelGroup");

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
    } as AdminMenuPlugin
];
