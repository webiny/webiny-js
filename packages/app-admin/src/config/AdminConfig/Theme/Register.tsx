import React from "react";
import { ConnectToProperties } from "@webiny/react-properties";
import { Property } from "@webiny/react-properties";
import { useIdGenerator } from "@webiny/react-properties";
import type { Theme } from "./types.js";

export interface ThemeRegisterProps {
    theme: Theme;
}

/**
 * Registers a selectable theme into the admin config. Use it from an admin extension:
 * `<AdminConfig.Public><AdminConfig.Theme.Register theme={dracula} /></AdminConfig.Public>`.
 * Registered themes are listed in the "Theme" submenu of the user menu; the built-in "light"
 * theme is always available and does not need to be registered.
 *
 * `Theme.Color` and `Theme.Register` are two layers of the same mechanism: both register config
 * data that `ThemeModeApplier` composes into a single set of inline CSS variables on `<html>`.
 * `Theme.Color` contributes a project's brand palette (`--color-<palette>-<shade>`), applied on
 * top of the active theme so branding survives a theme switch. `Theme.Register` contributes a
 * whole theme's worth of tokens (the neutral ramp plus the semantic aliases in `darkThemeBase`),
 * which the user chooses between at runtime.
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
