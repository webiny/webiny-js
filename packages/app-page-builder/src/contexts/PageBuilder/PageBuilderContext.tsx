import * as React from "react";
import { plugins } from "@webiny/plugins";
import { PbThemePlugin, PbTheme, DisplayMode } from "../../types";

export const PageBuilderContext = React.createContext(null);

export type ResponsiveDisplayMode = {
    displayMode: string;
    setDisplayMode: Function;
};

export type ExportPageData = {
    revisionType: string;
    setRevisionType: Function;
};

export type PageBuilderContextValue = {
    theme: PbTheme;
    defaults?: {
        pages?: {
            notFound?: React.ComponentType<any>;
        };
    };
    responsiveDisplayMode?: ResponsiveDisplayMode;
    exportPageData?: ExportPageData;
};

export type PageBuilderProviderProps = {
    children?: React.ReactChild | React.ReactChild[];
};

export const PageBuilderProvider = ({ children }: PageBuilderProviderProps) => {
    const [displayMode, setDisplayMode] = React.useState(DisplayMode.DESKTOP);
    const [revisionType, setRevisionType] = React.useState("published");

    const value: PageBuilderContextValue = React.useMemo(() => {
        const theme = Object.assign(
            {},
            ...plugins.byType<PbThemePlugin>("pb-theme").map(pl => pl.theme)
        );

        return {
            theme
        };
    }, []);

    return (
        <PageBuilderContext.Provider
            value={{
                ...value,
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
            {children}
        </PageBuilderContext.Provider>
    );
};

export const PageBuilderConsumer = ({ children }) => (
    <PageBuilderContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageBuilderContext.Consumer>
);
