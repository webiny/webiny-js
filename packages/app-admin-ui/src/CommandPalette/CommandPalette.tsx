import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import {
    CommandPaletteFeature,
    createReactiveComponent,
    useAdminConfig,
    useHotkeys
} from "@webiny/app-admin";
import { useContainer, useFeature } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { EmptyState, Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { NAVIGATION_GROUP, PALETTE_HOTKEY_ZINDEX } from "./constants.js";
import type { CommandGroup } from "./types.js";
import { commandVmsToGroups, deriveNavigationRows } from "./deriveRows.js";
import { CommandDetail, CommandItemRow, GroupHeading, HintIcon, Kbd } from "./components/index.js";

const CommandPaletteBase = () => {
    const [query, setQuery] = useState("");
    const { presenter } = useFeature(CommandPaletteFeature);
    const { menus } = useAdminConfig();
    const container = useContainer();
    const { vm } = presenter;

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const close = useCallback(() => {
        presenter.close();
        setQuery("");
    }, [presenter]);

    const navigateTo = useCallback(
        (to: string) => {
            container.resolve(RouterGateway).pushState(to);
            close();
        },
        [container, close]
    );

    const runCommand = useCallback((name: string) => presenter.useCommand(name), [presenter]);

    // mod+k toggles; backspace backs out of a detail view; command shortcuts run directly.
    const keys = useMemo(
        () => ({
            "mod+k": (e: KeyboardEvent) => {
                e.preventDefault();
                presenter.toggle();
                setQuery("");
            },
            backspace: (e: KeyboardEvent) => {
                // This is a global (document-level) handler, so only act while the palette
                // is actually open — otherwise it would swallow Backspace everywhere.
                if (!presenter.vm.isOpen) {
                    return;
                }
                // Never intercept Backspace while the user is editing text: <input>,
                // <textarea>, or any contentEditable (e.g. rich-text/lexical) element.
                const target = e.target;
                if (
                    target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement ||
                    (target instanceof HTMLElement && target.isContentEditable)
                ) {
                    return;
                }
                e.preventDefault();
                presenter.cancelCommand();
            },
            ...presenter.shortcutKeys
        }),
        [presenter, presenter.shortcutKeys]
    );

    useHotkeys({ zIndex: PALETTE_HOTKEY_ZINDEX, keys });

    const groups = useMemo<CommandGroup[]>(() => {
        const result: CommandGroup[] = [];
        const navigationRows = deriveNavigationRows(menus, navigateTo);
        if (navigationRows.length > 0) {
            result.push({ title: NAVIGATION_GROUP, rows: navigationRows });
        }
        result.push(...commandVmsToGroups(vm.commands, runCommand));
        return result;
    }, [menus, vm.commands, navigateTo, runCommand]);

    if (!vm.isOpen) {
        return null;
    }

    const active = vm.activeCommand;

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (active) {
                presenter.cancelCommand();
            } else {
                close();
            }
        }
    };

    return (
        <div
            role="presentation"
            onClick={close}
            className="fixed inset-0 z-overlay flex items-start justify-center bg-black/50"
            style={{ padding: "13vh 16px 16px", backdropFilter: "blur(2px)" }}
        >
            <div
                onClick={e => e.stopPropagation()}
                onKeyDown={onKeyDown}
                className="flex w-full flex-col overflow-hidden rounded-lg border border-neutral-dimmed bg-neutral-base shadow-xxl"
                style={{ maxWidth: 660, height: "45vh" }}
            >
                {active ? (
                    <CommandDetail
                        active={active}
                        onBack={() => presenter.cancelCommand()}
                        onClose={close}
                    />
                ) : (
                    <Command
                        label="Command palette"
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
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
                                <EmptyState
                                    type="select"
                                    title={`No results for “${query}”`}
                                    description="Try a page name, or an action like “new entry”."
                                />
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
                )}

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

export const CommandPalette = createReactiveComponent(CommandPaletteBase);
