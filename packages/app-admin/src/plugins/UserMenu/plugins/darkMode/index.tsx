import React from "react";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
import { DarkModeToggle } from "./DarkModeToggle";
import { DarkModeController } from "./DarkModeController";
import { UiStatePlugin } from "@webiny/app/types";

/**
 * This plugin provides a user menu item with a switch to toggle dark mode.
 */
const darkModeToggle: AdminHeaderUserMenuPlugin = {
    name: "admin-user-menu-dark-mode",
    type: "admin-header-user-menu",
    render() {
        return <DarkModeToggle />;
    }
};

/**
 * This plugin provides a mechanism to synchronize dark mode state with local storage and add/remove
 * proper CSS classes to the document `body`.
 */
const darkModeController: UiStatePlugin = {
    name: "admin-ui-state-dark-mode",
    type: "ui-state",
    render() {
        return <DarkModeController />;
    }
};

export default [darkModeToggle, darkModeController];
