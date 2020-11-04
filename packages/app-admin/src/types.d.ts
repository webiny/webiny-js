import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { Menu, Item, Section } from "./plugins/menu/Navigation/components";
import { ReactElement } from "react";
declare type RenderParams = {
    content: React.ReactNode;
};
export declare type AdminLayoutComponentPlugin = Plugin & {
    type: "admin-layout-component";
    render(params: RenderParams): React.ReactNode;
};
export declare type AdminGlobalSearchPlugin = Plugin & {
    type: "admin-global-search";
    label: string;
    route: string;
    search?: {
        operator?: "and" | "or";
        fields?: Array<string>;
    };
};
export declare type AdminGlobalSearchPreventHotkeyPlugin = Plugin & {
    type: "admin-global-search-prevent-hotkey";
    preventOpen(e: React.KeyboardEvent): boolean | void;
};
export declare type AdminMenuLogoPlugin = Plugin & {
    name: "admin-menu-logo";
    type: "admin-menu-logo";
    render(): React.ReactElement;
};
export declare type AdminHeaderUserMenuPlugin = Plugin & {
    type: "admin-header-user-menu";
    render(): React.ReactElement;
};
export declare type AdminHeaderUserMenuHandlePlugin = Plugin & {
    name: "admin-header-user-menu-handle";
    type: "admin-header-user-menu-handle";
    render(): React.ReactElement;
};
export declare type AdminHeaderUserMenuUserInfoPlugin = Plugin & {
    type: "admin-header-user-menu-user-info";
    render(): React.ReactElement;
};
/**
 * Enables adding custom menu sections and items in the main menu, located on the left side of the screen.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-menu
 */
export declare type AdminMenuPlugin = Plugin & {
    type: "admin-menu";
    render(props: {
        Menu: typeof Menu;
        Section: typeof Section;
        Item: typeof Item;
    }): React.ReactNode;
    order?: number;
};
/**
 * Enables adding custom header elements to the left side of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-header-left
 */
export declare type AdminHeaderLeftPlugin = Plugin & {
    type: "admin-header-left";
    render(params: RenderParams): React.ReactNode;
};
/**
 * Enables adding custom header elements to the right side of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-header-right
 */
export declare type AdminHeaderRightPlugin = Plugin & {
    type: "admin-header-right";
    render(params: RenderParams): React.ReactNode;
};
/**
 * Enables adding custom header elements to the middle of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-header-middle
 */
export declare type AdminHeaderMiddlePlugin = Plugin & {
    type: "admin-header-middle";
    render(params: RenderParams): React.ReactNode;
};
export declare type AdminMenuSettingsPlugin = Plugin & {
    type: "admin-menu-settings";
    render(props: {
        Section: typeof Section;
        Item: typeof Item;
    }): React.ReactNode;
};
export declare type AdminFileManagerFileTypePlugin = Plugin & {
    type: "admin-file-manager-file-type";
    types?: string[];
    render({ file }: {
        file: any;
    }): React.ReactNode;
    fileDetails?: {
        actions: Array<React.FunctionComponent | React.Component>;
    };
};
export declare type AdminInstallationPlugin = Plugin & {
    type: "admin-installation";
    isInstalled(params: {
        client: ApolloClient<object>;
    }): Promise<boolean>;
    title: string;
    dependencies?: string[];
    secure: boolean;
    render({ onInstalled }: {
        onInstalled: any;
    }): React.ReactNode;
};
export declare type ApiInformationDialogPlugin = Plugin & {
    type: "admin-api-information-dialog";
    render(): React.ReactNode;
};
export declare type AdminAppPermissionRendererPlugin = Plugin & {
    type: "admin-app-permissions-renderer";
    render(params: any): ReactElement;
};
export {};
