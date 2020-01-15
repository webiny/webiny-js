import * as React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { PbThemePlugin, PbTheme, PbPageLayoutPlugin } from "@webiny/app-page-builder/types";
import { ReactElement } from "react";

export const PageBuilderContext = React.createContext(null);

export type PageBuilderContextValue = {
    theme: PbTheme;
    isEditor?: boolean;
    defaults?: {
        pages?: {
            notFound?: React.ComponentType<any>;
            error?: React.ComponentType<any>;
        };
    };
};

export type PageBuilderProviderProps = {
    /**
     * DEPRECATED: this prop will be removed in future releases. Use `pb-theme` plugin to register a theme.
     */
    theme?: PbTheme;
    isEditor?: boolean;
    children?: ReactElement;
    [key: string]: any;
};

export const PageBuilderProvider = ({
    theme: bcTheme = null,
    children,
    ...rest
}: PageBuilderProviderProps) => {
    const value: PageBuilderContextValue = React.useMemo(() => {
        const theme = Object.assign(
            {},
            bcTheme,
            ...getPlugins("pb-theme").map((pl: PbThemePlugin) => pl.theme)
        );

        // For backwards compatibility, grab any page layouts defined in the theme and convert them to plugins
        if (theme.layouts) {
            registerPlugins(
                theme.layouts.map(l => ({
                    name: `pb-page-layout-${l.name}`,
                    type: `pb-page-layout`,
                    layout: l
                })) as PbPageLayoutPlugin[]
            );
        }

        return {
            theme,
            ...rest
        };
    }, []);

    return <PageBuilderContext.Provider value={value}>{children}</PageBuilderContext.Provider>;
};

export const PageBuilderConsumer = ({ children }) => (
    <PageBuilderContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageBuilderContext.Consumer>
);
