import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { Menu, Item, Section } from "./plugins/Menu/Navigation/components";
import {ReactElement} from "react";

type RenderParams = {
    content: React.ReactNode;
};

export type AdminLayoutComponentPlugin = Plugin & {
    type: "admin-layout-component";
    render(params: RenderParams): React.ReactNode;
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
export type AdminHeaderLeftPlugin = Plugin & {
    type: "admin-header-left";
    render(params: RenderParams): React.ReactNode;
};

/**
 * Enables adding custom header elements to the right side of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-header-right
 */
export type AdminHeaderRightPlugin = Plugin & {
    type: "admin-header-right";
    render(params: RenderParams): React.ReactNode;
};

/**
 * Enables adding custom header elements to the middle of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#admin-header-middle
 */
export type AdminHeaderMiddlePlugin = Plugin & {
    type: "admin-header-middle";
    render(params: RenderParams): React.ReactNode;
};

export type AdminMenuSettingsPlugin = Plugin & {
    type: "admin-menu-settings";
    render(props: { Section: typeof Section; Item: typeof Item }): React.ReactNode;
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
    isInstalled(params: { client: ApolloClient<object> }): Promise<boolean>;
    title: string;
    dependencies?: string[];
    secure: boolean;
    render({ onInstalled }): React.ReactNode;
};

export type ApiInformationDialogPlugin = Plugin & {
    type: "admin-api-information-dialog";
    render(): React.ReactNode;
};

export type AdminAppPermissionRenderer = Plugin & {
    type: "admin-app-permissions-renderer";
    render(params: any): ReactElement;
};