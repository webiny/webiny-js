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

export type MenuPlugin = Plugin & {
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

export type HeaderLeftPlugin = Plugin & {
    render(params: RenderParams): React.ReactNode;
};

export type HeaderRightPlugin = Plugin & {
    render(params: RenderParams): React.ReactNode;
};

export type HeaderMiddlePlugin = Plugin & {
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
