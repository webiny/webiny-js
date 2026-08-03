import React from "react";
import { Provider } from "@webiny/app";
import { AdminConfig, RegisterFeature, useRouter } from "@webiny/app-admin";
import { ActiveThemeProvider, ThemeLexicalColors } from "~/consumers/index.js";
import { ReactComponent as PaletteIcon } from "@webiny/icons/palette.svg";
import { THEME_PERMISSIONS_SCHEMA } from "~/constants.js";
import { ThemePermissionsFeature } from "~/features/permissions/feature.js";
import { ThemeGatewayFeature } from "~/features/themeGateway/feature.js";
import { ThemesFeature } from "~/features/themes/index.js";
import { ExtractionFeature } from "~/features/extraction/index.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { ThemeListView } from "~/presentation/ThemeList/ThemeListView.js";
import { ThemeEditorView } from "~/presentation/ThemeEditor/ThemeEditorView.js";
import { Routes } from "~/routes.js";

const { Security, Menu, Route } = AdminConfig;

const withActiveTheme = (Component: React.ComponentType<React.PropsWithChildren>) => {
    return function WithActiveTheme(props: React.PropsWithChildren) {
        return (
            <ActiveThemeProvider>
                <Component {...props} />
            </ActiveThemeProvider>
        );
    };
};

export const Extension = () => {
    const router = useRouter();

    return (
        <>
            <RegisterFeature feature={ThemePermissionsFeature} />
            <RegisterFeature feature={ThemeGatewayFeature} />
            <RegisterFeature feature={ThemesFeature} />
            <RegisterFeature feature={ExtractionFeature} />

            {/* Wraps the whole Admin app, not just the Theme screens: the pickers that read the
                active theme live in Website Builder and the rich-text toolbar. */}
            <Provider hoc={withActiveTheme} />

            <AdminConfig>
                {/* Publishes theme colours + policy to the rich-text toolbar. */}
                <ThemeLexicalColors />

                <Security.Permissions
                    name="theme"
                    title="Theme"
                    description="Manage design tokens, publishing and activation."
                    icon={<PaletteIcon />}
                    schema={THEME_PERMISSIONS_SCHEMA}
                />

                <HasPermission entity="theme">
                    <Route route={Routes.List} element={<ThemeListView />} />
                    <Route route={Routes.Editor} element={<ThemeEditorView />} />
                    <Menu
                        name="theme"
                        element={
                            <Menu.Link
                                text="Theme"
                                to={router.getLink(Routes.List)}
                                icon={<Menu.Link.Icon label="Theme" element={<PaletteIcon />} />}
                                pinnable={true}
                            />
                        }
                    />
                </HasPermission>
            </AdminConfig>
        </>
    );
};

Extension.displayName = "ThemeExtension";
