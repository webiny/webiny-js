import React from "react";
import { NavigationViewPlugin } from "@webiny/app-admin/plugins/NavigationViewPlugin";
import { NavigationMenuElement, TAGS } from "@webiny/app-admin/elements/NavigationMenuElement";
import { ReactComponent as SecurityIcon } from "../assets/icons/baseline-security-24px.svg";
import { Permission } from "./constants";

export default new NavigationViewPlugin(async view => {
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

    // const section = mainMenu.addElement(
    //     new NavigationMenuElement("security.section", {
    //         label: ""
    //     })
    // );

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
