import * as React from "react";
import { plugins } from "@webiny/plugins";
import { DisplayMode, PbTheme, PbThemePlugin as PbThemePluginType } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import { Theme } from "@webiny/app-theme/types";
import { ThemePlugin } from "@webiny/app-theme";
import { PageElementsProvider } from "./PageElementsProvider";
import { useCallback, useState } from "react";

export interface ResponsiveDisplayMode {
    displayMode: DisplayMode;
    setDisplayMode: Function;
}

export interface ExportPageData {
    revisionType: string;
    setRevisionType: Function;
}

export interface PageBuilderContext {
    theme: Theme | PbTheme | undefined;
    loadThemeFromPlugins(): void;
    defaults?: {
        pages?: {
            notFound?: React.ComponentType<any>;
        };
    };
    responsiveDisplayMode: ResponsiveDisplayMode;
    exportPageData: ExportPageData;
}

export interface PageBuilderProviderProps {
    children?: React.ReactChild | React.ReactChild[];
}

export const PageBuilderContext = React.createContext<PageBuilderContext | undefined>(undefined);

function tryLoadingTheme() {
    let themePlugin;
    if (isLegacyRenderingEngine) {
        const [firstThemePlugin] = plugins.byType<PbThemePluginType>("pb-theme");
        themePlugin = firstThemePlugin;
    } else {
        const [firstThemePlugin] = plugins.byType<ThemePlugin>(ThemePlugin.type);
        themePlugin = firstThemePlugin;
    }

    return themePlugin?.theme as Theme;
}

export const PageBuilderProvider: React.FC<PageBuilderProviderProps> = ({ children }) => {
    const [displayMode, setDisplayMode] = React.useState(DisplayMode.DESKTOP);
    const [revisionType, setRevisionType] = React.useState("published");
    const [theme, setTheme] = useState<PageBuilderContext["theme"]>(tryLoadingTheme());

    const loadThemeFromPlugins = useCallback(() => {
        const theme = tryLoadingTheme();

        if (theme) {
            setTheme(theme);
        }
    }, []);

    let childrenToRender = children;
    if (!isLegacyRenderingEngine) {
        // With the new page elements rendering engine, we also want to include the configured `PageElementsProvider`.
        childrenToRender = <PageElementsProvider>{childrenToRender}</PageElementsProvider>;
    }

    return (
        <PageBuilderContext.Provider
            value={{
                theme,
                loadThemeFromPlugins,
                responsiveDisplayMode: {
                    displayMode,
                    setDisplayMode
                },
                exportPageData: {
                    revisionType,
                    setRevisionType
                }
            }}
        >
            {childrenToRender}
        </PageBuilderContext.Provider>
    );
};
