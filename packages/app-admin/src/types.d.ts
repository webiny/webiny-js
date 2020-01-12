import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { Menu, Item, Section } from "./plugins/Menu/Navigation/components";
declare type RenderParams = {
    content: React.ReactNode;
};
export declare type ContentPlugin = Plugin & {
    render(params: RenderParams): React.ReactNode;
};
export declare type GlobalSearchPlugin = Plugin & {
    label: string;
    route: string;
    search?: {
        operator?: "and" | "or";
        fields?: Array<string>;
    };
};
export declare type GlobalSearchPreventHotkeyPlugin = Plugin & {
    preventOpen(e: React.KeyboardEvent): boolean | void;
};
export declare type HeaderLogoPlugin = Plugin & {
    render(): React.ReactElement;
};
export declare type HeaderUserMenuPlugin = Plugin & {
    render(): React.ReactElement;
};
export declare type HeaderUserMenuHandlePlugin = Plugin & {
    render(): React.ReactElement;
};
export declare type HeaderUserMenuUserInfoPlugin = Plugin & {
    render(): React.ReactElement;
};
export declare type MenuPlugin = Plugin & {
    render(props: {
        Menu: typeof Menu;
        Section: typeof Section;
        Item: typeof Item;
    }): React.ReactNode;
    order?: number;
};
export declare type HeaderLeftPlugin = Plugin & {
    render(params: RenderParams): React.ReactNode;
};
export declare type HeaderRightPlugin = Plugin & {
    render(params: RenderParams): React.ReactNode;
};
export declare type HeaderMiddlePlugin = Plugin & {
    render(params: RenderParams): React.ReactNode;
};
export declare type SettingsPlugin = Plugin & {
    settings: {
        name: string;
        type?: "app" | "integration" | "other";
        show?: () => boolean;
        route: React.ReactElement;
    };
};
export declare type FileManagerFileTypePlugin = Plugin & {
    types?: string[];
    render({ file }: {
        file: any;
    }): React.ReactNode;
    fileDetails?: {
        actions: Array<React.FunctionComponent | React.Component>;
    };
};
export declare type InstallationPlugin = Plugin & {
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
export declare type LayoutPlugin = ContentPlugin;
export declare type EmptyLayoutPlugin = ContentPlugin;
export {};
