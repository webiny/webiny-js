import React, { useEffect } from "react";
import get from "lodash/get";
import pluralize from "pluralize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavigationView } from "@webiny/app-admin/views/NavigationView";
import { NavigationMenuElement } from "@webiny/app-admin/elements/NavigationMenuElement";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "~/admin/viewsGraphql";
import useQuery from "~/admin/hooks/useQuery";
import usePermission from "~/admin/hooks/usePermission";
import { ContentGroupMenuElement } from "~/admin/elements/ContentGroupMenuElement";
import { NothingToShowElement } from "~/admin/elements/NothingToShowElement";
import { ContentModelMenuElement } from "~/admin/elements/ContentModelMenuElement";

interface Props {
    view: NavigationView;
}

export const ContentGroupsMenuItems = ({ view }: Props) => {
    const response = useQuery(LIST_MENU_CONTENT_GROUPS_MODELS);
    const { data: groups } = get(response, "data.listContentModelGroups") || {};

    const { canReadEntries } = usePermission();

    async function createMenuItems() {
        /**
         * !EDGE CASE ALERT!
         * We need to `awaitElement` because there's a case where you create a new Content Model, and immediately
         * leave the editor by clicking the "back" button. ApolloClient cache is already updated with the new content model,
         * and this current component's `useEffect` is triggered. The problem is that it all happens so fast that the
         * NavigationView is not yet mounted (because it uses a different layout component, <AdminLayout>, which
         * is not used in the Content Model Editor view), and `mainMenu` is not yet created.
         *
         * To fix this, we have the "awaitElement" method, which will poll the view in 200ms intervals to check for
         * existence of the element.
         */
        const mainMenu = await view.awaitElement<NavigationMenuElement>("headlessCms.mainMenu");
        if (!mainMenu) {
            return;
        }

        for (const group of groups) {
            // Check if user has "contentEntry" permission for any content model for a content model group
            const hasContentEntryPermission = group.contentModels.some(contentModel =>
                canReadEntries({
                    contentModelGroup: group,
                    contentModel
                })
            );

            if (group.contentModels.length > 0 && !hasContentEntryPermission) {
                continue;
            }

            const groupMenuItem = mainMenu.addElement(
                new ContentGroupMenuElement(`cms-content-models-${group.id}`, {
                    label: group.name,
                    icon: (
                        <FontAwesomeIcon
                            style={{ color: "var(--mdc-theme-text-secondary-on-background)" }}
                            icon={group.icon.split("/")}
                        />
                    )
                })
            );

            groupMenuItem.addElement(
                new NothingToShowElement(`cms-content-models-${group.id}-empty`, {
                    label: "Nothing to show.",
                    shouldRender() {
                        return group.contentModels.length === 0;
                    }
                })
            );

            group.contentModels.forEach(contentModel => {
                if (canReadEntries({ contentModelGroup: group, contentModel })) {
                    groupMenuItem.addElement(
                        new ContentModelMenuElement(contentModel.modelId, {
                            label: pluralize(contentModel.name),
                            path: `/cms/content-entries/${contentModel.modelId}`
                        })
                    );
                }
            });
        }

        view.refresh();
    }

    useEffect(() => {
        if (!groups) {
            return;
        }

        createMenuItems();
    }, [groups]);

    return null;
};
