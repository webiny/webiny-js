import React from "react";
import { useRegisterLegacyPlugin } from "~/hooks/useRegisterLegacyPlugin";

export interface LegacyPluginToReactComponentParams {
    pluginType: string;
    componentDisplayName: string;
}

export const legacyPluginToReactComponent = function <TProps extends Record<string, any>>(
    params: LegacyPluginToReactComponentParams
) {
    const Component: React.ComponentType<TProps> = props => {
        useRegisterLegacyPlugin({ ...props, type: params.pluginType });
        return null;
    };

    Component.displayName = params.componentDisplayName;

    return Component;
};
