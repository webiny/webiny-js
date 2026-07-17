import React, { useCallback, useMemo, useState } from "react";
import { Command, useCommandState } from "cmdk";
import { useAdminConfig, useHotkeys } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Icon } from "@webiny/admin-ui";
import type { MenuConfig } from "@webiny/app-admin/config/AdminConfig/Menu.js";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as SearchOffIcon } from "@webiny/icons/search_off.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";

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
    section?: string;
    to: string;
    icon?: React.ReactNode;
}

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
 * Derive navigation commands from the registered admin menus. A navigable menu is a
 * leaf `Menu.Link` (carries a `to` path + string `text`); `Menu.Item` parents/groups
 * have no `to` and are skipped, but their label is used as the child's section.
 */
const deriveNavigationCommands = (menus: MenuConfig[]): NavigationCommand[] => {
    const labelByName = new Map<string, string>();
    for (const menu of menus) {
        const element = menu.element;
        if (React.isValidElement(element)) {
            const text = (element.props as { text?: unknown }).text;
            if (typeof text === "string") {
                labelByName.set(menu.name, text);
            }
        }
    }

    const commands: NavigationCommand[] = [];
    for (const menu of menus) {
        if (!isNavigable(menu.element)) {
            continue;
        }
        const { to, text, icon } = menu.element.props;
        commands.push({
            name: menu.name,
            label: text,
            section: menu.parent ? labelByName.get(menu.parent) : undefined,
            to,
            icon
        });
    }
    return commands;
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <span
        className="inline-flex items-center justify-center rounded border border-neutral-dimmed bg-neutral-base text-neutral-muted"
        style={{ minWidth: 20, height: 20, padding: "0 6px", fontSize: 11, gap: 2 }}
    >
        {children}
    </span>
);

const HintIcon = ({ element }: { element: React.ReactNode }) => (
    <Icon icon={element} color={"neutral-light"} size={"xs"} label={""} />
);

interface CommandRowProps {
    command: NavigationCommand;
    onRun: () => void;
}

const CommandRow = ({ command, onRun }: CommandRowProps) => {
    const value = `${command.label} ${command.name}`.toLowerCase();
    const selected = useCommandState(state => (state.value || "") === value);

    return (
        <Command.Item
            value={value}
            onSelect={onRun}
            className="data-[selected=true]:bg-neutral-dimmed"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 12px",
                borderRadius: 8,
                cursor: "pointer"
            }}
        >
            <div
                className={
                    selected
                        ? "bg-primary-subtle border border-primary"
                        : "bg-neutral-subtle border border-neutral-dimmed"
                }
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    flex: "none"
                }}
            >
                {command.icon ?? <HintIcon element={<SearchIcon />} />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div
                    className="text-neutral-primary truncate"
                    style={{ fontSize: 14, fontWeight: 500 }}
                >
                    {command.label}
                </div>
                {command.section ? (
                    <div
                        className="text-neutral-muted truncate"
                        style={{ fontSize: 12.5, marginTop: 1 }}
                    >
                        {command.section}
                    </div>
                ) : null}
            </div>
            {selected ? (
                <span
                    className="bg-primary text-neutral-base"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 22,
                        padding: "0 9px",
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 500,
                        marginLeft: "auto",
                        flex: "none"
                    }}
                >
                    Open
                    <Icon icon={<ReturnIcon />} color={"neutral-base"} size={"xs"} label={""} />
                </span>
            ) : null}
        </Command.Item>
    );
};

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { menus } = useAdminConfig();
    const container = useContainer();

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
    }, []);

    const navigationCommands = useMemo(() => deriveNavigationCommands(menus), [menus]);

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
                setQuery("");
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
                className="flex w-full flex-col overflow-hidden border border-neutral-dimmed bg-neutral-base shadow-xxl"
                style={{ maxWidth: 660, maxHeight: "64vh", borderRadius: 14 }}
            >
                <Command
                    label="Command palette"
                    style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                    onKeyDown={e => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            close();
                        }
                    }}
                >
                    <div
                        className="border-b border-neutral-subtle"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 13,
                            padding: "15px 18px"
                        }}
                    >
                        <Icon
                            icon={<SearchIcon />}
                            color={"neutral-light"}
                            size={"md"}
                            label={"Search"}
                        />
                        <Command.Input
                            autoFocus
                            value={query}
                            onValueChange={setQuery}
                            spellCheck={false}
                            placeholder="Search for pages and actions…"
                            className="text-neutral-primary"
                            style={{
                                flex: 1,
                                minWidth: 0,
                                border: 0,
                                outline: 0,
                                background: "transparent",
                                fontSize: 18,
                                lineHeight: "24px",
                                padding: 0
                            }}
                        />
                        <Kbd>esc</Kbd>
                    </div>

                    <Command.List style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 6 }}>
                        <Command.Empty>
                            <div
                                className="text-neutral-muted"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    padding: "46px 20px 50px"
                                }}
                            >
                                <HintIcon element={<SearchOffIcon />} />
                                <div
                                    className="text-neutral-strong"
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        marginTop: 10,
                                        marginBottom: 4
                                    }}
                                >
                                    {`No results for “${query}”`}
                                </div>
                                <div style={{ fontSize: 13 }}>
                                    Try a page name, or an action like “new entry”.
                                </div>
                            </div>
                        </Command.Empty>

                        {navigationCommands.length > 0 ? (
                            <Command.Group
                                heading={
                                    <span
                                        className="text-neutral-muted"
                                        style={{
                                            display: "block",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            letterSpacing: ".06em",
                                            textTransform: "uppercase",
                                            padding: "13px 12px 5px"
                                        }}
                                    >
                                        Navigation
                                    </span>
                                }
                            >
                                {navigationCommands.map(command => (
                                    <CommandRow
                                        key={command.name}
                                        command={command}
                                        onRun={() => navigateTo(command.to)}
                                    />
                                ))}
                            </Command.Group>
                        ) : null}
                    </Command.List>
                </Command>

                <div
                    className="border-t border-neutral-subtle bg-neutral-subtle text-neutral-muted"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "9px 14px"
                    }}
                >
                    <span style={{ fontSize: 12 }}>Webiny command palette</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11.5
                            }}
                        >
                            <Kbd>
                                <HintIcon element={<ArrowUpIcon />} />
                                <HintIcon element={<ArrowDownIcon />} />
                            </Kbd>
                            Navigate
                        </span>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11.5
                            }}
                        >
                            <Kbd>
                                <HintIcon element={<ReturnIcon />} />
                            </Kbd>
                            Select
                        </span>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11.5
                            }}
                        >
                            <Kbd>⌘K</Kbd>
                            Actions
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
