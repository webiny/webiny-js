import React from "react";
import { ThemeColorPicker, type ThemeColorSelection } from "@webiny/app-theme";
import { createTokenReference } from "@webiny/website-builder-sdk";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";

/**
 * Renderer for `Webiny/ColorPicker`, the input type `createColorInput()` declares.
 *
 * It offers the active theme's palette, honours the theme's colour policy, and stores a *token reference*
 * when a swatch is picked — so a colour chosen here follows later theme changes exactly as an element
 * style does. Picking a free value stores a literal and detaches the input from the theme, which is the
 * same rule the style controls follow.
 *
 * The resolved colour travels with the reference as its `fallback`, so content keeps rendering the colour
 * it was given if the theme is later deactivated.
 */
export const ColorInputRenderer = ({
    value,
    token,
    onChange,
    input,
    label
}: ElementInputRendererProps) => {
    const handleChange = (selection: ThemeColorSelection) => {
        onChange(({ value }) => {
            if (selection.path) {
                value.setToken(
                    createTokenReference(selection.path, selection.value),
                    selection.value
                );
                return;
            }

            // A free value clears the reference — see `InputValueObject.set`.
            value.set(selection.value);
        });
    };

    // A token binding carries no literal of its own, so the swatch shows what the token resolves to.
    const currentValue =
        typeof value === "string" ? value : (token?.fallback ?? (input.defaultValue as string));

    return (
        <SidebarRow label={label}>
            <ThemeColorPicker
                value={currentValue}
                tokenPath={token?.path ?? null}
                onChange={handleChange}
            />
        </SidebarRow>
    );
};
