import React, { ReactElement } from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { ItemProps, MenuProps, SectionProps } from "~/ui/views/NavigationView/legacyMenu";

type RenderParams = {
    content: React.ReactNode;
};

export type AdminGlobalSearchPlugin = Plugin & {
    type: "admin-global-search";
    label: string;
    route: string;
    search?: {
        operator?: "and" | "or";
        fields?: Array<string>;
    };
};

export type AdminGlobalSearchPreventHotkeyPlugin = Plugin & {
    type: "admin-global-search-prevent-hotkey";
    preventOpen(e: React.KeyboardEvent): boolean | void;
};

export type AdminDrawerFooterMenuPlugin = Plugin & {
    type: "admin-drawer-footer-menu";
    render(params: any): React.ReactElement;
};

/**
 * LEGACY TYPE. Only for backwards compatibility.
 */
export type AdminMenuLogoPlugin = Plugin & {
    name: "admin-menu-logo";
    type: "admin-menu-logo";
    render(): React.ReactElement;
};

export type AdminHeaderUserMenuPlugin = Plugin & {
    type: "admin-header-user-menu";
    render(): React.ReactElement;
};

export type AdminHeaderUserMenuHandlePlugin = Plugin & {
    name: "admin-header-user-menu-handle";
    type: "admin-header-user-menu-handle";
    render(): React.ReactElement;
};

export type AdminHeaderUserMenuUserInfoPlugin = Plugin & {
    type: "admin-header-user-menu-user-info";
    render(): React.ReactElement;
};

/**
 * Enables adding custom menu sections and items in the main menu, located on the left side of the screen.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-menu
 */
export type AdminMenuPlugin = Plugin & {
    type: "admin-menu";
    render(props: {
        Menu: React.ComponentType<MenuProps>;
        Section: React.ComponentType<SectionProps>;
        Item: React.ComponentType<ItemProps>;
    }): React.ReactNode;
    order?: number;
};

/**
 * Enables adding custom header elements to the right side of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-header-right
 */
export type AdminHeaderRightPlugin = Plugin & {
    type: "admin-header-right";
    render(params: RenderParams): React.ReactNode;
};

export type AdminFileManagerFileTypePlugin = Plugin & {
    type: "admin-file-manager-file-type";
    types?: string[];
    render({ file }): React.ReactNode;
    fileDetails?: {
        actions: Array<React.FunctionComponent | React.Component>;
    };
};

export type AdminInstallationPlugin = Plugin & {
    type: "admin-installation";
    getInstalledVersion(params: { client: ApolloClient<object> }): Promise<string>;
    title: string;
    dependencies?: string[];
    secure: boolean;
    render({ onInstalled }): React.ReactNode;
    upgrades?: {
        version: string;
        getComponent(): React.ComponentType<{ onInstalled: () => void }>;
    }[];
};

export type AdminAppPermissionRendererPlugin = Plugin & {
    type: "admin-app-permissions-renderer";
    system?: boolean;
    render(params: any): ReactElement;
};
