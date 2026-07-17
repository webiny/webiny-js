import React from "react";
import type { MenuConfig } from "@webiny/app-admin/config/AdminConfig/Menu.js";
import type { CommandConfig } from "@webiny/app-admin/config/AdminConfig/CommandPalette.js";
import type { CommandGroup, CommandRow } from "./types.js";

const isNavigable = (
    element: unknown
): element is React.ReactElement<{ to: string; text: string; icon?: React.ReactNode }> => {
    if (!React.isValidElement(element)) {
        return false;
    }
    const props = element.props as { to?: unknown; text?: unknown };
    return (
        typeof props.to === "string" && !!props.to && typeof props.text === "string" && !!props.text
    );
};

/**
 * Derive Navigation rows from the registered admin menus. A navigable menu is a leaf
 * `Menu.Link` (carries a `to` path + string `text`); `Menu.Item` parents/groups have
 * no `to` and are skipped, but their label/icon are used for the child's section/icon.
 */
export const deriveNavigationRows = (
    menus: MenuConfig[],
    navigateTo: (to: string) => void
): CommandRow[] => {
    const labelByName = new Map<string, string>();
    const iconByName = new Map<string, React.ReactNode>();
    for (const menu of menus) {
        const element = menu.element;
        if (React.isValidElement(element)) {
            const props = element.props as { text?: unknown; icon?: React.ReactNode };
            if (typeof props.text === "string") {
                labelByName.set(menu.name, props.text);
            }
            if (props.icon) {
                iconByName.set(menu.name, props.icon);
            }
        }
    }

    const rows: CommandRow[] = [];
    for (const menu of menus) {
        if (!isNavigable(menu.element)) {
            continue;
        }
        const { to, text, icon } = menu.element.props;
        const parentIcon = menu.parent ? iconByName.get(menu.parent) : undefined;
        rows.push({
            key: menu.name,
            value: `${text} ${menu.name}`.toLowerCase(),
            label: text,
            sub: menu.parent ? labelByName.get(menu.parent) : undefined,
            icon: icon ?? parentIcon,
            verb: "Open",
            onRun: () => navigateTo(to)
        });
    }
    return rows;
};

/**
 * Group registered commands by their `group` (default "Actions"), preserving
 * registration order both across groups and within each group.
 */
export const deriveCommandGroups = (
    commands: CommandConfig[],
    runCommand: (command: CommandConfig) => void
): CommandGroup[] => {
    const groups = new Map<string, CommandRow[]>();
    for (const command of commands) {
        const rows = groups.get(command.group) ?? [];
        rows.push({
            key: command.name,
            value: `${command.label} ${command.keywords ?? ""} ${command.name}`.toLowerCase(),
            label: command.label,
            sub: command.description,
            icon: command.icon,
            shortcut: command.shortcut,
            verb: "Run",
            onRun: () => runCommand(command)
        });
        groups.set(command.group, rows);
    }
    return Array.from(groups, ([title, rows]) => ({ title, rows }));
};
