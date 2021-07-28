import React, { useEffect } from "react";
import { NavigationView } from "@webiny/app-admin/views/NavigationView";
import { NavigationMenuElement, TAGS } from "@webiny/app-admin/elements/NavigationMenuElement";
import { ReactComponent as HeadlessCmsIcon } from "~/admin/icons/devices_other-black-24px.svg";
import GlobalSearchPlugins from "./GlobalSearchPlugins";
import usePermission from "~/admin/hooks/usePermission";
import { ContentGroupsMenuItems } from "./ContentGroupsMenuItems";

interface Props {
    view: NavigationView;
}

export const CmsMenuLoader = React.memo(({ view }: Props) => {
    const {
        canAccessManageEndpoint,
        canReadContentModels,
        canReadContentModelGroups,
        canCreateContentModels,
        canCreateContentModelGroups
    } = usePermission();

    const hasAccess =
        canAccessManageEndpoint && (canReadContentModels || canReadContentModelGroups);

    useEffect(() => {
        if (!hasAccess) {
            return;
        }

        /**
         * Create the main "Headless CMS" menu group.
         */
        const mainMenu = view.addAppMenuElement(
            new NavigationMenuElement("headlessCms.mainMenu", {
                label: "Headless CMS",
                icon: <HeadlessCmsIcon />
            })
        );

        /**
         * Add "Content Models" section if the user can create either models or groups.
         */
        if (canCreateContentModels || canCreateContentModelGroups) {
            const contentModelsMenu = mainMenu.addElement(
                new NavigationMenuElement("headlessCms.contentModels", {
                    label: "Content Models"
                })
            );

            if (canCreateContentModels) {
                contentModelsMenu.addElement(
                    new NavigationMenuElement("headlessCms.contentModels.models", {
                        label: "Models",
                        path: "/cms/content-models"
                    })
                );
            }

            if (canCreateContentModelGroups) {
                contentModelsMenu.addElement(
                    new NavigationMenuElement("headlessCms.contentModels.groups", {
                        label: "Groups",
                        path: "/cms/content-model-groups"
                    })
                );
            }
        }
    }, []);

    if (!hasAccess) {
        return null;
    }

    return (
        <>
            <GlobalSearchPlugins />
            <ContentGroupsMenuItems view={view}/>
        </>
    );
});

CmsMenuLoader.displayName = "CmsMenuLoader";
