import React, { useCallback, useMemo, useState } from "react";
import { useAdminConfig, useHotkeys } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Command } from "@webiny/admin-ui/Command/index.js";
import type { MenuConfig } from "@webiny/app-admin/config/AdminConfig/Menu.js";

/**
 * Dedicated hotkey layer for the command palette. `useHotkeys` only fires handlers
 * registered on the current top-most zIndex, so the palette owns its own layer.
 * NOTE: components that register a higher zIndex while open will shadow `mod+k`.
 * Layering interplay is revisited in a later phase.
 */
const PALETTE_HOTKEY_ZINDEX = 90;

interface NavigationCommand {
    name: string;
    label: string;
    to: string;
    icon?: React.ReactNode;
}

/**
 * A navigable menu entry is a leaf `Menu.Link` — its element carries a `to` path
 * string plus a `text` label. Parent/group entries (`Menu.Item`) have no `to` and
 * are skipped. `text` is a string in every current registration; anything else is
 * skipped defensively (it can't be searched or displayed as a plain command).
 */
const toNavigationCommand = (menu: MenuConfig): NavigationCommand | null => {
    const element = menu.element;
    if (!React.isValidElement(element)) {
        return null;
    }

    const props = element.props as { to?: unknown; text?: unknown; icon?: React.ReactNode };
    if (typeof props.to !== "string" || !props.to) {
        return null;
    }
    if (typeof props.text !== "string" || !props.text) {
        return null;
    }

    return { name: menu.name, label: props.text, to: props.to, icon: props.icon };
};

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const { menus } = useAdminConfig();
    const container = useContainer();

    const close = useCallback(() => setOpen(false), []);

    const navigationCommands = useMemo(
        () => menus.map(toNavigationCommand).filter((c): c is NavigationCommand => c !== null),
        [menus]
    );

    const navigateTo = useCallback(
        (to: string) => {
            container.resolve(RouterGateway).pushState(to);
            close();
        },
        [container, close]
    );

    useHotkeys({
        zIndex: PALETTE_HOTKEY_ZINDEX,
        keys: {
            "mod+k": e => {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        }
    });

    if (!open) {
        return null;
    }

    return (
        <div
            role="presentation"
            onClick={close}
            className="fixed inset-0 z-overlay flex items-start justify-center bg-neutral-dark/40"
            style={{ padding: "13vh 16px 16px", backdropFilter: "blur(2px)" }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="flex w-full flex-col overflow-hidden rounded-xl border border-neutral-dimmed bg-neutral-base shadow-xxl"
                style={{ maxWidth: 660 }}
            >
                <Command
                    className="h-auto"
                    onKeyDown={e => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            close();
                        }
                    }}
                >
                    <div className="border-b border-neutral-subtle p-sm">
                        <Command.Input autoFocus placeholder="Search for pages and actions…" />
                    </div>
                    <Command.List>
                        <Command.Empty>
                            No results found. [debug menus={menus.length} nav=
                            {navigationCommands.length}]
                        </Command.Empty>
                        {navigationCommands.length > 0 ? (
                            <Command.Group heading="Navigation">
                                {navigationCommands.map(command => (
                                    <Command.Item
                                        key={command.name}
                                        value={`${command.label} ${command.name}`}
                                        onSelect={() => navigateTo(command.to)}
                                    >
                                        <span className="flex items-center gap-sm-extra">
                                            {command.icon}
                                            {command.label}
                                        </span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        ) : null}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
};
