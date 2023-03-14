import React, { ReactElement } from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { ItemProps, MenuProps, SectionProps } from "~/plugins/MenuPlugin";
import { FileItem } from "~/components/FileManager/types";

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

/**
 * LEGACY TYPE. Only for backwards compatibility.
 */
export type AdminMenuLogoPlugin = Plugin & {
    name: "admin-menu-logo";
    type: "admin-menu-logo";
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

export interface AdminFileManagerFileTypePluginRenderParams {
    file: FileItem;
}
export type AdminFileManagerFileTypePlugin = Plugin & {
    type: "admin-file-manager-file-type";
    types: string[];
    render(params: AdminFileManagerFileTypePluginRenderParams): React.ReactNode;
    fileDetails?: {
        actions: Array<React.FC | React.Component>;
    };
};

export interface AdminInstallationPluginRenderParams {
    onInstalled: () => Promise<void>;
}
export type AdminInstallationPlugin = Plugin & {
    type: "admin-installation";
    getInstalledVersion(params: { client: ApolloClient<object> }): Promise<string | null>;
    title: string;
    dependencies?: string[];
    secure: boolean;
    render(params: AdminInstallationPluginRenderParams): React.ReactNode;
};

export type AdminAppPermissionRendererPlugin = Plugin & {
    type: "admin-app-permissions-renderer";
    system?: boolean;
    render(params: any): ReactElement;
};
