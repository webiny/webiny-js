import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
import type { Theme as ThemeDefinition, ThemeColorConfig } from "./Theme/types.js";

export type ThemeColorProps = ThemeColorConfig;

/**
 * Sets a brand color on the admin UI. Without `shade`, the full 0-900 ramp is derived from
 * `color`; with it, only that shade is overridden:
 * `<AdminConfig.Public><AdminConfig.Theme.Color palette={"primary"} color={"blue"} /></AdminConfig.Public>`.
 *
 * Registers the color as config data rather than writing CSS variables itself — see
 * `Theme/resolveBrandVariables.ts` for why. Branding is layered on top of whichever theme is
 * active, so it outranks a theme's default accent and survives a theme switch.
 */
export const Color = React.memo(({ palette, color, shade }: ThemeColorProps) => {
    const getId = useIdGenerator("ThemeColor");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                // `0` is a valid shade, hence the explicit undefined check: a truthiness check
                // would give shade 0 the same id as the whole-ramp entry.
                id={getId(palette, shade === undefined ? "all" : String(shade))}
                name={"brandColors"}
                array={true}
                value={{ palette, color, shade }}
            />
        </ConnectToProperties>
    );
});

Color.displayName = "Theme.Color";

export interface ThemeRegisterProps {
    theme: ThemeDefinition;
}

/**
 * Registers a selectable theme into the admin config. Use it from an admin extension:
 * `<AdminConfig.Public><AdminConfig.Theme.Register theme={dracula} /></AdminConfig.Public>`.
 * Registered themes appear in the sidebar theme switcher; the built-in "light" theme is
 * always available and does not need to be registered.
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
