import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
import { assignColor } from "./Theme/assignColor.js";
import type { ColorPalette, ColorShade, Theme as ThemeDefinition } from "./Theme/types.js";

export interface ThemeColorProps {
    palette: ColorPalette;
    color: string;
    shade?: ColorShade;
}

export const Color = React.memo(({ palette, color, shade }: ThemeColorProps) => {
    assignColor(palette, color, shade);
    return null;
});

Color.displayName = "Color";

export interface ThemeRegisterProps {
    theme: ThemeDefinition;
}

/**
 * Registers a selectable theme into the admin config. Use it from an admin extension:
 * `<AdminConfig.Public><AdminConfig.Theme.Register theme={dracula} /></AdminConfig.Public>`.
 * Registered themes appear in the sidebar theme switcher; the built-in "light" theme is
 * always available and does not need to be registered.
 */
export const Register = React.memo(({ theme }: ThemeRegisterProps) => {
    const getId = useIdGenerator("Theme");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={getId(theme.id)} name={"themes"} array={true} value={theme} />
        </ConnectToProperties>
    );
});

Register.displayName = "Theme.Register";

export interface ThemeProps {
    children: React.ReactNode;
}

const ThemeBase = React.memo(({ children }: ThemeProps) => {
    return <>{children}</>;
});

ThemeBase.displayName = "Theme";

export const Theme = Object.assign(ThemeBase, {
    Color,
    Register
});
