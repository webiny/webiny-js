import React, { Fragment } from "react";
import { AddMenu as Menu } from "@webiny/app-admin";
import { ReactComponent as HeadlessCmsIcon } from "~/admin/icons/devices_other-black-24px.svg";
import GlobalSearchPlugins from "./GlobalSearchPlugins";
import usePermission from "~/admin/hooks/usePermission";
import { ContentGroupsMenuItems } from "./ContentGroupsMenuItems";

const CmsMenuLoaderComponent: React.FC = () => {
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
                        {canCreateContentModels && (
                            <Menu
                                name={"headlessCMS.contentModels.models"}
                                label={"Models"}
                                path={"/cms/content-models"}
                            />
                        )}
                        {canCreateContentModelGroups && (
                            <Menu
                                name={"headlessCMS.contentModels.groups"}
                                label={"Groups"}
                                path={"/cms/content-model-groups"}
                            />
                        )}
                    </Menu>
                )}
                <ContentGroupsMenuItems />
            </Menu>
            <GlobalSearchPlugins />
        </Fragment>
    );
};

export const CmsMenuLoader: React.FC = React.memo(CmsMenuLoaderComponent);

CmsMenuLoader.displayName = "CmsMenuLoader";
