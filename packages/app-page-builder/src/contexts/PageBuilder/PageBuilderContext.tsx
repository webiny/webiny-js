import * as React from "react";
import { DisplayMode, PbTheme } from "~/types";

import { Theme } from "@webiny/app-theme/types";
import { useTheme } from "@webiny/app-theme";
import { PageElementsProvider } from "./PageElementsProvider";

export interface ResponsiveDisplayMode {
    displayMode: DisplayMode;
    setDisplayMode: (value: DisplayMode) => void;
}

export enum PbRevisionType {
    published = "published",
    latest = "latest"
}

export interface ExportPageData {
    revisionType: PbRevisionType;
    setRevisionType: (value: PbRevisionType) => void;
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

export const PageBuilderProvider = ({ children }: PageBuilderProviderProps) => {
    const [displayMode, setDisplayMode] = React.useState(DisplayMode.DESKTOP);
    const [revisionType, setRevisionType] = React.useState<PbRevisionType>(
        PbRevisionType.published
    );
    const { theme, loadThemeFromPlugins } = useTheme();

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
            <PageElementsProvider>{children}</PageElementsProvider>
        </PageBuilderContext.Provider>
    );
};
