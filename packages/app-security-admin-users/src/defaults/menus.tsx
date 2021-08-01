import React from "react";
import { NavigationMenuElement, TAGS } from "@webiny/app-admin/elements/NavigationMenuElement";
import { Permission } from "./constants";
import { ViewPlugin } from "@webiny/ui-composer/View";
import { NavigationView } from "@webiny/app-admin/views/NavigationView";

export default new ViewPlugin<NavigationView>(NavigationView, async view => {
    await view.isRendered();

    const { identity } = view.getSecurityHook();
    const groups = identity.getPermission(Permission.Groups);
    const users = identity.getPermission(Permission.Users);
    const apiKeys = identity.getPermission(Permission.ApiKeys);

    if (!groups && !users && !apiKeys) {
        return;
    }

    const mainMenu = view.getSettingsMenuElement().addElement(
        new NavigationMenuElement("security", {
            label: "Security",
            tags: [TAGS.UTILS]
        })
    );

    if (users) {
        mainMenu.addElement(
            new NavigationMenuElement("users", {
                label: "Users",
                path: "/security/users"
            })
        );
    }

    if (groups) {
        mainMenu.addElement(
            new NavigationMenuElement("groups", {
                label: "Groups",
                path: "/security/groups"
            })
        );
    }

    if (apiKeys) {
        mainMenu.addElement(
            new NavigationMenuElement("apiKeys", {
                label: "API Keys",
                path: "/security/api-keys"
            })
        );
    }
});
