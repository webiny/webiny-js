import React, { useCallback, useMemo, useState } from "react";
import { Command } from "cmdk";
import { useAdminConfig, useHotkeys } from "@webiny/app-admin";
import { useContainer } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Icon, Text } from "@webiny/admin-ui";
import type { CommandConfig } from "@webiny/app-admin/config/AdminConfig/CommandPalette.js";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as SearchOffIcon } from "@webiny/icons/search_off.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { NAVIGATION_GROUP, PALETTE_HOTKEY_ZINDEX } from "./constants.js";
import type { CommandGroup } from "./types.js";
import { deriveCommandGroups, deriveNavigationRows } from "./deriveRows.js";
import { CommandItemRow, GroupHeading, HintIcon, Kbd } from "./components/index.js";

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { menus, commands } = useAdminConfig();
    const container = useContainer();

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
    }, []);

    const navigateTo = useCallback(
        (to: string) => {
            container.resolve(RouterGateway).pushState(to);
            close();
        },
        [container, close]
    );

    const runCommand = useCallback(
        (command: CommandConfig) => {
            command.onSelect();
            close();
        },
        [close]
    );

    const groups = useMemo<CommandGroup[]>(() => {
        const result: CommandGroup[] = [];
        const navigationRows = deriveNavigationRows(menus, navigateTo);
        if (navigationRows.length > 0) {
            result.push({ title: NAVIGATION_GROUP, rows: navigationRows });
        }
        result.push(...deriveCommandGroups(commands, runCommand));
        return result;
    }, [menus, commands, navigateTo, runCommand]);

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

                        {groups.map(group => (
                            <Command.Group
                                key={group.title}
                                heading={<GroupHeading title={group.title} />}
                            >
                                {group.rows.map(row => (
                                    <CommandItemRow key={row.key} row={row} />
                                ))}
                            </Command.Group>
                        ))}
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
