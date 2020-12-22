import React, { useEffect } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { AdminGlobalSearchPlugin } from "@webiny/app-admin/types";
import { plugins } from "@webiny/plugins";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "./../../viewsGraphql";
import { ReactComponent as HeadlessCmsIcon } from "../../icons/devices_other-black-24px.svg";

const t = i18n.ns("app-headless-cms/admin/menus");

const HeadlessCmsMenu = ({ Menu, children }) => {
    const { getCurrentLocale } = useI18N();
    const response = useQuery(LIST_MENU_CONTENT_GROUPS_MODELS);

    const locale = getCurrentLocale("content");

    const contentModelGroups = get(response, "data.listContentModelGroups.data", []);

    const cmgHash = contentModelGroups.reduce((returnValue, currentValue) => {
        return (
            returnValue +
            currentValue.contentModels.reduce((returnValue, currentValue) => {
                return returnValue + currentValue.modelId;
            }, "")
        );
    }, "");

    // Generate "admin-global-search" plugins - enables the user to search content via the global search bar.
    useEffect(() => {
        // 1. Unregister all previously registered plugins.
        plugins
            .byType<AdminGlobalSearchPlugin>("admin-global-search")
            .filter(item => item.name.startsWith("admin-global-search-headless-cms"))
            .forEach(item => plugins.unregister(item.name));

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

    return (
        <Menu name="headless-cms" icon={<HeadlessCmsIcon />} label={t`Headless CMS`}>
            {children}
        </Menu>
    );
};

export default HeadlessCmsMenu;
