import { useEffect } from "react";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { AdminGlobalSearchPlugin } from "@webiny/app-admin/types";
import { plugins } from "@webiny/plugins";
import { useQuery } from "~/admin/hooks";
import {
    LIST_MENU_CONTENT_GROUPS_MODELS,
    ListMenuCmsGroupsQueryResponse
} from "~/admin/viewsGraphql";
import { CmsGroup } from "~/types";

/**
 * DISCLAIMER!
 * This file is OLD and needs refactoring into something that makes more sense in the context of the new UI Composer.
 * Even if we keep a dedicated `AdminGlobalSearchPlugin`, it needs to be converted to a proper class.
 * This can be a "good first issue" for community to solve.
 */
const GlobalSearchPlugins = () => {
    const { getCurrentLocale } = useI18N();
    const response = useQuery<ListMenuCmsGroupsQueryResponse>(LIST_MENU_CONTENT_GROUPS_MODELS);

    const locale = getCurrentLocale("content");

    const contentModelGroups: CmsGroup[] =
        get(response, "data.listContentModelGroups.data", []) || [];

    const cmgHash = contentModelGroups.reduce((returnValue: string, currentValue) => {
        return (
            returnValue +
            currentValue.contentModels.reduce((returnValue: string, currentValue) => {
                return returnValue + currentValue.modelId;
            }, "")
        );
    }, "");

    // Generate "admin-global-search" plugins - enables the user to search content via the global search bar.
    useEffect(() => {
        // 1. Unregister all previously registered plugins.
        plugins
            .byType<AdminGlobalSearchPlugin>("admin-global-search")
            .filter(item => item.name && item.name.startsWith("admin-global-search-headless-cms"))
            .forEach(item => plugins.unregister(item.name as string));

        // 2. Register a new set of plugins via the latest list of content models.
        contentModelGroups.forEach(group => {
            group.contentModels.forEach(contentModel => {
                const pluginName = "admin-global-search-headless-cms-" + contentModel.modelId;
                if (!plugins.byName(pluginName)) {
                    plugins.register({
                        type: "admin-global-search",
                        name: "admin-global-search-headless-cms-" + contentModel.modelId,
                        route: "/cms/content-entries/" + contentModel.modelId,
                        label: contentModel.name
                    });
                }
            });
        });
    }, [locale, cmgHash]);

    return null;
};

export default GlobalSearchPlugins;
