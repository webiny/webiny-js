import React from "react";
import type { MenuConfig } from "@webiny/app-admin/config/AdminConfig/Menu.js";
import type { CommandItemVm } from "@webiny/app-admin";
import type { CommandGroup, CommandRow } from "./types.js";

const DEFAULT_COMMAND_GROUP = "Actions";

const SHORTCUT_SYMBOLS: Record<string, string> = {
    cmd: "⌘",
    command: "⌘",
    mod: "⌘",
    ctrl: "⌃",
    control: "⌃",
    alt: "⌥",
    option: "⌥",
    shift: "⇧",
    enter: "↵",
    return: "↵"
};

/**
 * Turn an is-hotkey shortcut string ("cmd+shift+m") into display chips (["⌘","⇧","M"]).
 */
export const formatShortcut = (shortcut?: string): string[] | undefined => {
    if (!shortcut) {
        return undefined;
    }
    return shortcut
        .split("+")
        .map(token => token.trim())
        .filter(Boolean)
        .map(token => SHORTCUT_SYMBOLS[token.toLowerCase()] ?? token.toUpperCase());
};

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
    const parentByName = new Map<string, string | null>();
    for (const menu of menus) {
        parentByName.set(menu.name, menu.parent ?? null);
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

    // Full ancestor breadcrumb ("Settings › System"), so same-named leaves under
    // different sections (e.g. the File Manager app vs. its settings page) are
    // distinguishable. Depth-guarded against malformed parent cycles.
    const sectionFor = (name: string): string | undefined => {
        const parts: string[] = [];
        let parent = parentByName.get(name) ?? null;
        for (let depth = 0; parent && depth < 10; depth++) {
            const label = labelByName.get(parent);
            if (label) {
                parts.unshift(label);
            }
            parent = parentByName.get(parent) ?? null;
        }
        return parts.length > 0 ? parts.join(" › ") : undefined;
    };

    // Leaf items often carry no icon of their own; walk up to the nearest ancestor
    // that has one (a group may be icon-less, but the section root usually isn't).
    const iconFor = (name: string, ownIcon?: React.ReactNode): React.ReactNode | undefined => {
        if (ownIcon) {
            return ownIcon;
        }
        let parent = parentByName.get(name) ?? null;
        for (let depth = 0; parent && depth < 10; depth++) {
            const icon = iconByName.get(parent);
            if (icon) {
                return icon;
            }
            parent = parentByName.get(parent) ?? null;
        }
        return undefined;
    };

    const rows: CommandRow[] = [];
    const seenPaths = new Set<string>();
    for (const menu of menus) {
        if (!isNavigable(menu.element)) {
            continue;
        }
        const { to, text, icon } = menu.element.props;
        // Skip exact duplicate destinations (same path registered more than once).
        if (seenPaths.has(to)) {
            continue;
        }
        seenPaths.add(to);

        rows.push({
            key: menu.name,
            value: `${text} ${menu.name}`.toLowerCase(),
            label: text,
            sub: sectionFor(menu.name),
            icon: iconFor(menu.name, icon),
            verb: "Open",
            onRun: () => navigateTo(to)
        });
    }
    return rows;
};

/**
 * Group DI commands (from the presenter view model) by their `category` (default
 * "Actions"), preserving order. Commands with a detail view show "Open" (the palette
 * stays open on a sub-view); the rest show "Run".
 */
export const commandVmsToGroups = (
    commands: CommandItemVm[],
    runCommand: (name: string) => void
): CommandGroup[] => {
    const groups = new Map<string, CommandRow[]>();
    for (const command of commands) {
        const category = command.category ?? DEFAULT_COMMAND_GROUP;
        const rows = groups.get(category) ?? [];
        rows.push({
            key: command.name,
            value: `${command.label} ${(command.keywords ?? []).join(" ")} ${command.name}`.toLowerCase(),
            label: command.label,
            sub: command.description,
            icon: command.icon,
            shortcut: formatShortcut(command.shortcut),
            verb: command.hasDetailView ? "Open" : "Run",
            onRun: () => runCommand(command.name)
        });
        groups.set(category, rows);
    }
    return Array.from(groups, ([title, rows]) => ({ title, rows }));
};
