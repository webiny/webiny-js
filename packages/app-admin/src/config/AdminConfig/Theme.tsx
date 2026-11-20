import React from "react";
import { ConnectToProperties } from "@webiny/react-properties";
import { Property } from "@webiny/react-properties";
import { useIdGenerator } from "@webiny/react-properties";
import type { ThemeColorConfig } from "./Theme/types.js";
import { Register } from "./Theme/Register.js";

export type { ThemeRegisterProps } from "./Theme/Register.js";

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
    /*
     * `0` is a valid shade, hence the explicit undefined check: a truthiness check would give
     * shade 0 the same id as the whole-ramp entry.
     */
    const shadeKey = shade === undefined ? "all" : String(shade);

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(palette, shadeKey)}
                name={"brandColors"}
                array={true}
                value={{ palette, color, shade }}
            />
        </ConnectToProperties>
    );
});

Color.displayName = "Theme.Color";

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
