import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";
import { makeDecoratable } from "@webiny/react-composition";

export interface StyleSettingsPluginProps {
    plugin: PbEditorPageElementStyleSettingsPlugin;
    children: React.ReactNode;
}

export const StyleSettingsPlugin = makeDecoratable(
    "StyleSettingsPlugin",
    ({ children }: StyleSettingsPluginProps) => {
        return <>{children}</>;
    }
);
