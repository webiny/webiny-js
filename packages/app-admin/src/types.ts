import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { Menu, Item, Section } from "./plugins/Menu/Navigation/components";

type RenderParams = {
    content: React.ReactNode;
};

export type ContentPlugin = Plugin & {
    render(params: RenderParams): React.ReactNode;
};

export type GlobalSearchPlugin = Plugin & {
    label: string;
    route: string;
    search?: {
        operator?: "and" | "or";
        fields?: Array<string>;
    };
};

export type GlobalSearchPreventHotkeyPlugin = Plugin & {
    preventOpen(e: React.KeyboardEvent): boolean | void;
};

export type HeaderLogoPlugin = Plugin & {
    render(): React.ReactElement;
};

export type HeaderUserMenuPlugin = Plugin & {
    render(): React.ReactElement;
};

export type HeaderUserMenuHandlePlugin = Plugin & {
    render(): React.ReactElement;
};

export type HeaderUserMenuUserInfoPlugin = Plugin & {
    render(): React.ReactElement;
};

/**
 * Enables adding custom menu sections and items in the main menu, located on the left side of the screen.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#menu
 */
export type MenuPlugin = Plugin & {
    type: "menu";
    description: "Enables adding custom menu sections and items in the main menu, located on the left side of the screen."
    render(props: {
        Menu: typeof Menu;
        Section: typeof Section;
        Item: typeof Item;
    }): React.ReactNode;
    order?: number;
};

export type MenuContentSectionPlugin = Plugin & {
    render(props: { Section: typeof Section; Item: typeof Item }): React.ReactNode;
};

/**
 * Enables adding custom header elements to the left side of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#header-left
 */
export type HeaderLeftPlugin = Plugin & {
    type: "header-left";
    description: "Enables adding custom header elements to the left side of the top bar.";
    render(params: RenderParams): React.ReactNode;
};

/**
 * Enables adding custom header elements to the right side of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#header-right
 */
export type HeaderRightPlugin = Plugin & {
    type: "header-right";
    description: "Enables adding custom header elements to the right side of the top bar.";
    render(params: RenderParams): React.ReactNode;
};

/**
 * Enables adding custom header elements to the middle of the top bar.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#header-middle
 */
export type HeaderMiddlePlugin = Plugin & {
    type: "header-middle";
    description: "Enables adding custom header elements to the middle of the top bar.";
    render(params: RenderParams): React.ReactNode;
};

export type SettingsPlugin = Plugin & {
    settings: {
        name: string;
        type?: "app" | "integration" | "other";
        show?: () => boolean;
        route: React.ReactElement;
    };
};

export type FileManagerFileTypePlugin = Plugin & {
    types?: string[];
    render({ file }): React.ReactNode;
    fileDetails?: {
        actions: Array<React.FunctionComponent | React.Component>;
    };
};

export type InstallationPlugin = Plugin & {
    isInstalled(params: { client: ApolloClient<object> }): Promise<boolean>;
    title: string;
    dependencies?: string[];
    secure: boolean;
    render({ onInstalled }): React.ReactNode;
};

export type LayoutPlugin = ContentPlugin;
export type EmptyLayoutPlugin = ContentPlugin;
