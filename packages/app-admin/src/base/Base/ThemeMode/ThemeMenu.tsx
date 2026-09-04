import React from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as PaletteIcon } from "@webiny/icons/palette.svg";
import { useTheme } from "./useTheme.js";

/**
 * Theme picker for the top-bar user dropdown (registered between "Account settings" and
 * "Sign out"). Renders a single compact "Theme" entry that expands into a submenu listing all
 * available themes as checkbox items, with a check next to the active one. Selecting one applies
 * and persists it via `useTheme().setTheme`.
 */
export const ThemeMenu = () => {
    const { theme, setTheme, themes } = useTheme();

    return (
        <DropdownMenu.Item
            text={"Theme"}
            icon={<DropdownMenu.Item.Icon element={<PaletteIcon />} label={"Theme"} />}
        >
            {themes.map(option => (
                <DropdownMenu.CheckboxItem
                    key={option.id}
                    text={option.name}
                    checked={option.id === theme}
                    onCheckedChange={() => setTheme(option.id)}
                />
            ))}
        </DropdownMenu.Item>
    );
};
