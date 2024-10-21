import React, { ReactElement } from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { ItemProps, MenuProps, SectionProps } from "~/plugins/MenuPlugin";

export { Icon } from "~/components/IconPicker/types";

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
        actions: Array<React.ComponentType | React.Component>;
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

import { SecurityPermission } from "@webiny/app-security/types";

/**
 * Represents a file as we receive from the GraphQL API.
 */
export interface FileItem {
    id: string;
    name: string;
    key: string;
    src: string;
    size: number;
    type: string;
    tags: string[];
    aliases: string[];
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
    savedOn: string;
    savedBy: {
        id: string;
        displayName: string;
    };
    modifiedOn: string;
    modifiedBy: {
        id: string;
        displayName: string;
    };
    location: {
        folderId: string;
    };
    meta?: {
        private?: boolean;
        width?: number;
        height?: number;
    };
    accessControl?: {
        type: "public" | "private-authenticated";
    };
    extensions?: Record<string, any>;
}

export interface FileManagerSecurityPermission extends SecurityPermission {
    rwd?: string;
    own?: boolean;
}

export type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;
