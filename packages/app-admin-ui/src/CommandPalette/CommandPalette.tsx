import React, { useCallback, useMemo, useState } from "react";
import { Command, useCommandState } from "cmdk";
import { useAdminConfig, useHotkeys } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Icon, Text } from "@webiny/admin-ui";
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

    const commands: NavigationCommand[] = [];
    for (const menu of menus) {
        if (!isNavigable(menu.element)) {
            continue;
        }
        const { to, text, icon } = menu.element.props;
        // Leaf items often carry no icon of their own — inherit the parent section's.
        const parentIcon = menu.parent ? iconByName.get(menu.parent) : undefined;
        commands.push({
            name: menu.name,
            label: text,
            section: menu.parent ? labelByName.get(menu.parent) : undefined,
            to,
            icon: icon ?? parentIcon
        });
    }
    return commands;
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <span
        className="inline-flex items-center justify-center rounded-sm border border-neutral-dimmed bg-neutral-base text-xs text-neutral-muted"
        style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            gap: 2,
            fontFamily: "var(--font-family-mono, monospace)"
        }}
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
            className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-xs-plus data-[selected=true]:bg-neutral-dimmed"
        >
            <div
                className={
                    "grid size-xl shrink-0 place-items-center rounded-md border " +
                    (selected
                        ? "border-primary bg-primary-subtle"
                        : "border-neutral-dimmed bg-neutral-subtle")
                }
            >
                {command.icon ?? null}
            </div>
            <div className="min-w-0 flex-1">
                <Text as="div" size="md" className="truncate font-medium text-neutral-primary">
                    {command.label}
                </Text>
                {command.section ? (
                    <Text as="div" size="sm" className="truncate text-neutral-muted">
                        {command.section}
                    </Text>
                ) : null}
            </div>
            {selected ? (
                <span className="ml-auto inline-flex shrink-0 items-center gap-xs rounded-sm bg-primary px-xs py-xs text-sm font-medium text-neutral-base">
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
            className="fixed inset-0 z-overlay flex items-start justify-center bg-neutral-dark/50"
            style={{ padding: "13vh 16px 16px", backdropFilter: "blur(2px)" }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="flex w-full flex-col overflow-hidden rounded-lg border border-neutral-dimmed bg-neutral-base shadow-xxl"
                style={{ maxWidth: 660, maxHeight: "64vh" }}
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
                    <div className="flex items-center gap-sm border-b border-neutral-subtle px-md py-sm-plus">
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
                            className="min-w-0 flex-1 border-0 bg-transparent text-lg text-neutral-primary outline-none"
                        />
                        <Kbd>esc</Kbd>
                    </div>

                    <Command.List
                        className="p-xs-plus"
                        style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
                    >
                        <Command.Empty>
                            <div className="flex flex-col items-center gap-md p-xl text-center text-neutral-muted">
                                <HintIcon element={<SearchOffIcon />} />
                                <Text
                                    as="div"
                                    size="lg"
                                    className="font-semibold text-neutral-strong"
                                >
                                    {`No results for “${query}”`}
                                </Text>
                                <Text as="div" size="sm">
                                    Try a page name, or an action like “new entry”.
                                </Text>
                            </div>
                        </Command.Empty>

                        {navigationCommands.length > 0 ? (
                            <Command.Group
                                heading={
                                    <span
                                        className="block px-sm pb-xs pt-sm text-xs font-semibold uppercase text-neutral-muted"
                                        style={{ letterSpacing: ".06em" }}
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

                <div className="flex items-center justify-between gap-sm border-t border-neutral-subtle bg-neutral-subtle px-sm py-xs-plus text-neutral-muted">
                    <Text size="sm">Webiny command palette</Text>
                    <div className="flex items-center gap-md">
                        <Text size="sm" className="inline-flex items-center gap-xs">
                            <Kbd>
                                <HintIcon element={<ArrowUpIcon />} />
                                <HintIcon element={<ArrowDownIcon />} />
                            </Kbd>
                            Navigate
                        </Text>
                        <Text size="sm" className="inline-flex items-center gap-xs">
                            <Kbd>
                                <HintIcon element={<ReturnIcon />} />
                            </Kbd>
                            Select
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
};
