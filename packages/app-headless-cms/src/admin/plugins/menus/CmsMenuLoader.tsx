import React, { useEffect } from "react";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";
import { NavigationMenuElement } from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { ReactComponent as HeadlessCmsIcon } from "~/admin/icons/devices_other-black-24px.svg";
import GlobalSearchPlugins from "./GlobalSearchPlugins";
import usePermission from "~/admin/hooks/usePermission";
import { ContentGroupsMenuItems } from "./ContentGroupsMenuItems";
import { ContentGroupMenuElement } from "~/admin/elements/ContentGroupMenuElement";

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

        mainMenu.addSorter((a, b) => {
            if (a instanceof ContentGroupMenuElement && b instanceof NavigationMenuElement) {
                return 1;
            }

            if (a instanceof NavigationMenuElement && b instanceof ContentGroupMenuElement) {
                return -1;
            }

            return 0;
        });

        /**
         * Add "Content Models" section if the user can create either models or groups.
         */
        if (canCreateContentModels || canCreateContentModelGroups) {
            const contentModelsMenu = mainMenu.addElement<NavigationMenuElement>(
                new NavigationMenuElement("headlessCms.contentModels", {
                    label: "Content Models"
                })
            );

            if (canCreateContentModels) {
                contentModelsMenu.addElement<NavigationMenuElement>(
                    new NavigationMenuElement("headlessCms.contentModels.models", {
                        label: "Models",
                        path: "/cms/content-models"
                    })
                );
            }

            if (canCreateContentModelGroups) {
                contentModelsMenu.addElement<NavigationMenuElement>(
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
            <ContentGroupsMenuItems view={view} />
        </>
    );
});

CmsMenuLoader.displayName = "CmsMenuLoader";
