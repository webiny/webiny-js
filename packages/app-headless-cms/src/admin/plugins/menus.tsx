import React, { useCallback } from "react";
import { useSecurity } from "@webiny/app-security";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import HeadlessCmsMenu from "./menus/HeadlessCmsMenu";
import ContentModelMenuItems from "./menus/ContentModelMenuItems";
import ContentModelMenuSection from "./menus/ContentModelMenuSection";

const CmsMenu = ({ Menu, Section, Item }) => {
    const { identity } = useSecurity();

    const canRead = useCallback((permissionName: string) => {
        const permission = identity.getPermission(permissionName);
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("r");
    }, []);

    const canReadContentModels = canRead("cms.contentModel");
    const canReadContentModelGroups = canRead("cms.contentModelGroup");

    // Don't show the menu if the user doesn't have the "read" access for both "cms.contentModel" and "cms.contentModelGroup".
    if (!canReadContentModels && !canReadContentModelGroups) {
        return null;
    }

    return (
        <HeadlessCmsMenu Menu={Menu}>
            <ContentModelMenuItems Section={Section} Item={Item} />
            <ContentModelMenuSection Section={Section} Item={Item} />
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
