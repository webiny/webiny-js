import * as React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { PbThemePlugin } from "@webiny/app-page-builder/types";
import { PbTheme } from "../../types";

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

export const PageBuilderProvider = ({ theme: bcTheme, children, ...rest }) => {
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
                }))
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
