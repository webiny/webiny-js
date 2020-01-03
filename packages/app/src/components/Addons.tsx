import React from "react";
import { getPlugins } from "@webiny/plugins";

export const Addons = () => {
    return (
        <>
            {getPlugins("addon-render").map((plugin: any) => {
                return React.cloneElement(plugin.component, {
                    key: plugin.name
                });
            })}
        </>
    );
};
