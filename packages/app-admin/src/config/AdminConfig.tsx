import React from "react";
import { createProvider } from "@webiny/app";
import { Menu, type MenuConfig } from "./AdminConfig/Menu.js";
import type { TenantConfig } from "./AdminConfig/Tenant.js";
import { Tenant } from "./AdminConfig/Tenant.js";
import type { SupportMenuConfig } from "./AdminConfig/Menu/SupportMenu.js";
import type { UserMenuConfig } from "./AdminConfig/Menu/UserMenu.js";
import { Route } from "./AdminConfig/Route.js";
import { Theme } from "./AdminConfig/Theme.js";
import { Dashboard } from "./AdminConfig/Dashboard.js";
import { type WidgetConfig } from "./AdminConfig/Widget.js";
import { Security } from "./AdminConfig/Security.js";
import type { PermissionRendererConfig } from "../permissions/types.js";
import { LexicalTheme } from "./AdminConfig/LexicalTheme.js";
import { Title } from "./AdminConfig/Title.js";
import { Logo } from "./AdminConfig/Logo.js";
import { Dialog } from "./AdminConfig/Dialog.js";
import type { DialogConfig } from "./AdminConfig/Dialog.js";
import { createAdminConfig } from "./createAdminConfig.js";
import type { EditorTheme } from "@webiny/lexical-theme";
import { createLexicalTokens } from "@webiny/lexical-theme/createLexicalEditorTokens.js";

const base = createAdminConfig<AdminConfig>();

export const AdminWithConfig = Object.assign(base.WithConfig, {
    displayName: "AdminWithConfig"
});

interface AdminConfig {
    menus: MenuConfig[];
    supportMenus: SupportMenuConfig[];
    userMenus: UserMenuConfig[];
    tenant: TenantConfig;
    title: string;
    squareLogo: React.ReactNode;
    horizontalLogo: React.ReactNode;
    widgets: WidgetConfig[];
    permissionRenderers: PermissionRendererConfig[];
    lexicalTheme: EditorTheme;
    dialogs: DialogConfig[];
}

/* Once the app fully renders (after the LoginScreen), apply protected configs. */
export const AdminConfigPlugin = <base.ApplyProtectedConfig />;

export const AdminConfigProvider = createProvider(Original => {
    return function AdminConfigProvider({ children }) {
        return (
            <AdminWithConfig>
                <base.ApplyPublicConfig />
                <Original>{children}</Original>
            </AdminWithConfig>
        );
    };
});

const lexicalTokens = createLexicalTokens("wa-lx-");

export const useAdminConfig = () => {
    const baseConfig = base.useConfig();

    const lexicalTheme: EditorTheme = {
        colors: baseConfig.lexicalTheme?.colors,
        typography: baseConfig.lexicalTheme?.typography || {},
        tokens: lexicalTokens
    };

    return {
        menus: baseConfig.menus ?? [],
        userMenus: baseConfig.userMenus ?? [],
        supportMenus: baseConfig.supportMenus ?? [],
        title: baseConfig.title,
        logo: {
            squareLogo: baseConfig.squareLogo,
            horizontalLogo: baseConfig.horizontalLogo
        },
        widgets: baseConfig.widgets ?? [],
        permissionRenderers: baseConfig.permissionRenderers ?? [],
        lexicalTheme,
        dialogs: baseConfig.dialogs ?? []
    };
};

export interface PublicProps {
    children: React.ReactNode;
}

export const Public = ({ children }: PublicProps) => {
    return <base.PublicConfig>{children}</base.PublicConfig>;
};

export interface PrivateProps {
    children: React.ReactNode;
}

export const Private = ({ children }: PrivateProps) => {
    return <base.PrivateConfig>{children}</base.PrivateConfig>;
};

export const AdminConfig = Object.assign(Private, {
    Public,
    Theme,
    Menu,
    Route,
    Tenant,
    Title,
    Logo,
    Dashboard,
    Security,
    LexicalTheme,
    Dialog,
    useAdminConfig
});
