import React from "react";
import { AppContainer, Plugin } from "@webiny/app";
import { Menu, type MenuConfig } from "./AdminConfig/Menu.js";
import type { TenantConfig } from "./AdminConfig/Tenant.js";
import { Tenant } from "./AdminConfig/Tenant.js";
import type { SupportMenuConfig } from "./AdminConfig/Menu/SupportMenu.js";
import type { UserMenuConfig } from "./AdminConfig/Menu/UserMenu.js";
import { Route } from "./AdminConfig/Route.js";
import { Theme } from "./AdminConfig/Theme.js";
import { Dashboard } from "./AdminConfig/Dashboard.js";
import { type WidgetConfig } from "./AdminConfig/Widget.js";
import { LexicalTheme } from "./AdminConfig/LexicalTheme.js";
import { Title } from "./AdminConfig/Title.js";
import { Logo } from "./AdminConfig/Logo.js";
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
    lexicalTheme: EditorTheme;
}

export const AdminConfigProvider = AppContainer.createDecorator(Original => {
    return function AdminConfigProvider({ children }) {
        return (
            <>
                {/* Wrap the entire app with an AdminConfig provider, and apply all public configs. */}
                <Original>
                    <AdminWithConfig>
                        <base.ApplyPublicConfig />
                        {children}
                    </AdminWithConfig>
                </Original>
                {/* Once the app fully renders (after the LoginScreen), apply protected configs. */}
                <Plugin>
                    <base.ApplyProtectedConfig />
                </Plugin>
            </>
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
        tenant: baseConfig.tenant || {},
        title: baseConfig.title || baseConfig.tenant?.name || "",
        logo: {
            squareLogo: baseConfig.squareLogo || baseConfig.tenant?.squareLogo,
            horizontalLogo: baseConfig.horizontalLogo || baseConfig.tenant?.horizontalLogo
        },
        widgets: baseConfig.widgets ?? [],
        lexicalTheme
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
    LexicalTheme,
    useAdminConfig
});
