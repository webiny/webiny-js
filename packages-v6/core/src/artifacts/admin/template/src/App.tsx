import React from "react";
import { Admin } from "@webiny/admin";
import { composeAsync, AdminConfig, ConfigModifier, PluginsModifier } from "@webiny/core";

const Bootstrap = React.lazy(
    () =>
        new Promise<{ default: React.ComponentType }>(async resolve => {
            // Config phase (ADD GENERATED CONFIG MODIFIERS HERE!)
            const configModifiers: ConfigModifier<AdminConfig>[] = [];

            console.log("Loading configs... 12345");
            const config = await composeAsync(configModifiers)({} as AdminConfig);

            // Generated plugins (ADD GENERATED PLUGINS MODIFIERS HERE!)
            const pluginsModifiers: PluginsModifier<JSX.Element>[] = [];

            console.log("Loading plugins...");
            const plugins = await composeAsync(pluginsModifiers)([]);

            console.log(config, plugins);

            resolve({
                default: () => (
                    <Admin>
                        {plugins.map((element, key) => React.cloneElement(element, { key }))}
                    </Admin>
                )
            });
        })
);

export const App = () => {
    return (
        <React.Suspense fallback={null}>
            <Bootstrap />
        </React.Suspense>
    );
};
