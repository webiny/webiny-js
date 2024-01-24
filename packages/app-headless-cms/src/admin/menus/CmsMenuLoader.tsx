import React, { Fragment } from "react";
import { AddMenu as Menu } from "@webiny/app-admin";
import { ReactComponent as HeadlessCmsIcon } from "~/admin/icons/devices_other-black-24px.svg";
import GlobalSearchPlugins from "./GlobalSearchPlugins";
import usePermission from "~/admin/hooks/usePermission";
import { ContentGroupsMenuItems } from "./ContentGroupsMenuItems";

interface ChildMenuProps {
    canAccess: boolean;
}

const CmsContentModelsMenu = ({ canAccess }: ChildMenuProps) => {
    if (!canAccess) {
        return null;
    }
    return (
        <Menu
            name={"headlessCMS.contentModels.models"}
            label={"Models"}
            path={"/cms/content-models"}
        />
    );
};

const CmsContentGroupsMenu = ({ canAccess }: ChildMenuProps) => {
    if (!canAccess) {
        return null;
    }
    return (
        <Menu
            name={"headlessCMS.contentModels.groups"}
            label={"Groups"}
            path={"/cms/content-model-groups"}
        />
    );
};

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
        <Fragment>
            <Menu name={"headlessCMS"} label={"Headless CMS"} icon={<HeadlessCmsIcon />}>
                {(canCreateContentModels || canCreateContentModelGroups) && (
                    <Menu name={"headlessCMS.contentModels"} label={"Content Models"} pin={"first"}>
                        <CmsContentModelsMenu canAccess={canCreateContentModels} />
                        <CmsContentGroupsMenu canAccess={canCreateContentModelGroups} />
                    </Menu>
                )}
                <ContentGroupsMenuItems />
            </Menu>
            <GlobalSearchPlugins />
        </Fragment>
    );
};

export const CmsMenuLoader: React.ComponentType = React.memo(CmsMenuLoaderComponent);

CmsMenuLoader.displayName = "CmsMenuLoader";
