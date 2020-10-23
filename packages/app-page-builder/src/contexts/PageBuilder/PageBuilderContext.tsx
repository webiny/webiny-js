import * as React from "react";
import { plugins } from "@webiny/plugins";
import { PbThemePlugin, PbTheme } from "@webiny/app-page-builder/types";

export const PageBuilderContext = React.createContext(null);

export type PageBuilderContextValue = {
    theme: PbTheme;
    defaults?: {
        pages?: {
            notFound?: React.ComponentType<any>;
            error?: React.ComponentType<any>;
        };
    };
};

export type PageBuilderProviderProps = {
    children?: React.ReactChild | React.ReactChild[];
};

export const PageBuilderProvider = ({ children }: PageBuilderProviderProps) => {
    const value: PageBuilderContextValue = React.useMemo(() => {
        const theme = Object.assign(
            {},
            ...plugins.byType<PbThemePlugin>("pb-theme").map(pl => pl.theme)
        );

        return {
            theme
        };
    }, []);

    return <PageBuilderContext.Provider value={value}>{children}</PageBuilderContext.Provider>;
};

export const PageBuilderConsumer = ({ children }) => (
    <PageBuilderContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageBuilderContext.Consumer>
);
