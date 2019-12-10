// @flow
import * as React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";

export const PageBuilderContext = React.createContext({});

export const PageBuilderProvider = ({ children, ...rest }: Object) => {
    const value = React.useMemo(() => {
        const theme = Object.assign({}, ...getPlugins("pb-theme").map(pl => pl.theme));

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

export const PageBuilderConsumer = ({ children }: Object) => (
    <PageBuilderContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageBuilderContext.Consumer>
);
