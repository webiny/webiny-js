import * as React from "react";
import { plugins } from "@webiny/plugins";
import { DisplayMode, PbTheme, PbThemePlugin as PbThemePluginType } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import { Theme } from "@webiny/app-theme/types";
import { ThemePlugin } from "@webiny/app-theme";
import { PageElementsProvider } from "./PageElementsProvider";

export interface ResponsiveDisplayMode {
    displayMode: DisplayMode;
    setDisplayMode: Function;
}

export interface ExportPageData {
    revisionType: string;
    setRevisionType: Function;
}

export interface PageBuilderContextValue {
    theme: Theme | PbTheme;
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

export const PageBuilderContext = React.createContext<PageBuilderContextValue>({
    /**
     * Initial value. It will never be null
     */
    theme: null as unknown as PbTheme,
    defaults: {
        pages: {
            notFound: undefined
        }
    },
    responsiveDisplayMode: {
        displayMode: DisplayMode.DESKTOP,
        setDisplayMode: () => {
            return void 0;
        }
    },
    exportPageData: {
        revisionType: "",
        setRevisionType: () => {
            return void 0;
        }
    }
});

export const PageBuilderProvider: React.FC<PageBuilderProviderProps> = ({ children }) => {
    const [displayMode, setDisplayMode] = React.useState(DisplayMode.DESKTOP);
    const [revisionType, setRevisionType] = React.useState("published");

    let childrenToRender = children;
    if (!isLegacyRenderingEngine) {
        // With the new page elements rendering engine, we also want to include the configured `PageElementsProvider`.
        childrenToRender = <PageElementsProvider>{childrenToRender}</PageElementsProvider>;
    }

    return (
        <PageBuilderContext.Provider
            value={{
                get theme() {
                    let themePlugin;
                    if (isLegacyRenderingEngine) {
                        const [firstThemePlugin] = plugins.byType<PbThemePluginType>("pb-theme");
                        themePlugin = firstThemePlugin;
                    } else {
                        const [firstThemePlugin] = plugins.byType<ThemePlugin>(
                            ThemePlugin.type
                        );
                        themePlugin = firstThemePlugin;
                    }

                    if (!themePlugin) {
                        throw new Error(
                            "Theme plugin does not exist. Make sure that at least one plugin is loaded."
                        );
                    }
                    return themePlugin.theme;
                },
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

export const PageBuilderConsumer: React.FC = ({ children }) => (
    <PageBuilderContext.Consumer>
        {props =>
            React.cloneElement(children as unknown as React.ReactElement, { pageBuilder: props })
        }
    </PageBuilderContext.Consumer>
);
