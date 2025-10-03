import React from "react";
import { AdminConfig, useRouter } from "@webiny/app-admin";
import { ReactComponent as HeadlessCmsIcon } from "@webiny/icons/web.svg";
import { ReactComponent as HeadlessCmsContentIcon } from "@webiny/icons/wysiwyg.svg";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { ContentGroupsMenuItems } from "./ContentGroupsMenuItems.js";
import { Routes } from "~/routes.js";

const { Menu } = AdminConfig;

interface ChildMenuProps {
    canAccess: boolean;
}

const CmsContentModelsMenu = ({ canAccess }: ChildMenuProps) => {
    const router = useRouter();

    if (!canAccess) {
        return null;
    }

    return (
        <Menu
            name={"headlessCMS.contentModels.models"}
            parent={"headlessCMS"}
            element={<Menu.Link text={"Models"} to={router.getLink(Routes.ContentModels.List)} />}
        />
    );
};

const CmsContentGroupsMenu = ({ canAccess }: ChildMenuProps) => {
    const router = useRouter();

    if (!canAccess) {
        return null;
    }
    return (
        <Menu
            name={"headlessCMS.contentModels.groups"}
            parent={"headlessCMS"}
            element={
                <Menu.Link text={"Groups"} to={router.getLink(Routes.ContentModelGroups.List)} />
            }
        />
    );
};

// Helper components for clarity and DRY

/**
 * Renders the main "Headless CMS" menu item in the admin sidebar.
 * This is the top-level entry point for all CMS-related navigation.
 * The menu item includes a custom icon and is positioned after the "home" menu.
 */
const CmsContentModelingMenu = () => (
    <Menu
        name="headlessCMS"
        after="home"
        element={
            <Menu.Item
                text="Content Modeling"
                icon={<Menu.Link.Icon label="Headless CMS" element={<HeadlessCmsIcon />} />}
            />
        }
    />
);

/**
 * Displays the "Content" submenu under the Headless CMS section.
 * This menu item provides access to content management features within the CMS.
 * It uses the same icon as the main CMS menu for visual consistency.
 */
const CmsContentMenu = () => (
    <Menu
        name="headlessCMSContent"
        after="headlessCMS"
        element={
            <Menu.Item
                text="Content"
                icon={<Menu.Link.Icon label="Content" element={<HeadlessCmsContentIcon />} />}
            />
        }
    />
);

const CmsMenuLoaderComponent = () => {
    const {
        canAccessManageEndpoint,
        canReadContentModels,
        canReadContentModelGroups,
        canCreateContentModels,
        canCreateContentModelGroups
    } = usePermission();

    const hasAccess =
        canAccessManageEndpoint && (canReadContentModels || canReadContentModelGroups);

    if (!hasAccess) {
        return null;
    }

    return (
        <>
            <CmsContentModelingMenu />
            <CmsContentMenu />
            {(canCreateContentModels || canCreateContentModelGroups) && (
                <>
                    <CmsContentModelsMenu canAccess={canCreateContentModels} />
                    <CmsContentGroupsMenu canAccess={canCreateContentModelGroups} />
                </>
            )}
            <ContentGroupsMenuItems />
        </>
    );
};

export const CmsMenuLoader: React.ComponentType = React.memo(CmsMenuLoaderComponent);

CmsMenuLoader.displayName = "CmsMenuLoader";
