import React from "react";
import { DropdownMenu, Icon } from "@webiny/admin-ui";
import { ReactComponent as PaletteIcon } from "@webiny/icons/palette.svg";
import { useTheme } from "./useTheme.js";

/**
 * Sidebar footer control for picking the admin UI theme. Renders a sidebar-styled trigger
 * that opens a dropdown listing all available themes, with a check next to the active one.
 *
 * Items use `DropdownMenu.CheckboxItem` (Radix `onCheckedChange`) rather than an `onClick`
 * handler on a plain item — the native selection event fires reliably even as the menu
 * closes on select.
 */
export const ThemeSwitcher = () => {
    const { theme, setTheme, themes } = useTheme();
    const current = themes.find(t => t.id === theme);

    return (
        <DropdownMenu
            side={"top"}
            align={"start"}
            className={"w-[220px]"}
            trigger={
                <button
                    type={"button"}
                    className={
                        "flex w-full items-center gap-sm rounded-md px-sm py-xs-plus text-md text-left text-neutral-primary cursor-pointer transition-colors hover:bg-neutral-dark/5 overflow-hidden"
                    }
                >
                    <Icon
                        icon={<PaletteIcon />}
                        label={"Theme"}
                        color={"neutral-strong"}
                        size={"sm"}
                    />
                    <span className={"truncate group-data-[state=collapsed]:hidden"}>
                        {current?.label ?? "Theme"}
                    </span>
                </button>
            }
        >
            {themes.map(option => (
                <DropdownMenu.CheckboxItem
                    key={option.id}
                    text={option.label}
                    checked={option.id === theme}
                    onCheckedChange={() => setTheme(option.id)}
                />
            ))}
        </DropdownMenu>
    );
};
