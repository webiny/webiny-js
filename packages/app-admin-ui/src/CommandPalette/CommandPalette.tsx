import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import {
    CommandPaletteFeature,
    createReactiveComponent,
    useAdminConfig,
    useHotkeys
} from "@webiny/app-admin";
import { useContainer, useFeature } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { AI_COMMAND_NAME, NAVIGATION_GROUP, PALETTE_HOTKEY_ZINDEX } from "./constants.js";
import type { CommandGroup } from "./types.js";
import { commandVmsToGroups, deriveNavigationRows } from "./deriveRows.js";
import {
    CommandDetail,
    CommandItemRow,
    GroupHeading,
    HintIcon,
    Kbd,
    NoResults,
    PaletteFooter,
    type Hint
} from "./components/index.js";
import { useAiMode } from "./modes/index.js";

const COMMAND_HINTS: Hint[] = [
    {
        keys: (
            <>
                <HintIcon element={<ArrowUpIcon />} />
                <HintIcon element={<ArrowDownIcon />} />
            </>
        ),
        label: "Navigate"
    },
    { keys: <HintIcon element={<ReturnIcon />} />, label: "Select" },
    { keys: "space", label: "Ask AI" }
];

const CommandPaletteBase = () => {
    const [query, setQuery] = useState("");
    const [modeActive, setModeActive] = useState(false);
    const { presenter } = useFeature(CommandPaletteFeature);
    const { menus } = useAdminConfig();
    const container = useContainer();
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { vm } = presenter;

    /*
     * One mode today. The palette talks to it only through `PaletteMode`, so everything the
     * assistant needs lives in `useAiMode` rather than here. A second mode turns this into a
     * registry; nothing above this line has to change for that.
     */
    const mode = useAiMode(scrollRef);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const close = useCallback(() => {
        presenter.close();
        setQuery("");
        setModeActive(false);
        mode.reset();
    }, [presenter, mode]);

    const enterMode = useCallback(
        (seed?: string) => {
            setModeActive(true);
            setQuery("");
            mode.enter(seed);
            // The input is shared across modes, so focus has to be restored explicitly after the
            // surrounding tree swaps.
            requestAnimationFrame(() => inputRef.current?.focus());
        },
        [mode]
    );

    const exitMode = useCallback(() => {
        setModeActive(false);
        setQuery("");
        mode.reset();
    }, [mode]);

    const navigateTo = useCallback(
        (to: string) => {
            container.resolve(RouterGateway).pushState(to);
            close();
        },
        [container, close]
    );

    const runCommand = useCallback(
        (name: string) => {
            // This command selects a palette MODE, not an action. A mode needs the shared input row,
            // so the palette switches into it rather than letting the presenter open a detail view.
            if (name === AI_COMMAND_NAME) {
                enterMode();
                return;
            }
            presenter.useCommand(name);
        },
        [presenter, enterMode]
    );

    /*
     * mod+k cycles closed -> commands -> AI -> closed, so the same key that opens the palette also
     * reaches the assistant without the user having to know about the space shortcut. Closing from AI
     * mode keeps mod+k a way OUT of the palette, which is what it does everywhere else.
     * Backspace backs out of a detail view; command shortcuts run directly.
     */
    const keys = useMemo(
        () => ({
            "mod+k": (e: KeyboardEvent) => {
                e.preventDefault();

                if (!vm.isOpen) {
                    presenter.open();
                    setQuery("");
                    setModeActive(false);
                    return;
                }

                /*
                 * A detail view renders in place of the command list, so switching to AI mode from
                 * there would put the user in a mode they cannot see. Back out to the list instead.
                 */
                if (vm.activeCommand) {
                    presenter.cancelCommand();
                    return;
                }

                if (!modeActive) {
                    enterMode();
                    return;
                }

                close();
            },
            backspace: (e: KeyboardEvent) => {
                if (e.target instanceof HTMLInputElement) {
                    return;
                }
                e.preventDefault();
                presenter.cancelCommand();
            },
            ...presenter.shortcutKeys
        }),
        [
            presenter,
            presenter.shortcutKeys,
            vm.isOpen,
            vm.activeCommand,
            modeActive,
            enterMode,
            close
        ]
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

    const askAiFromQuery = () => enterMode(query);

    /* Null while the command list is showing, which is what every `chrome ?` below tests for. */
    const chrome = modeActive ? mode.chrome : null;

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (active) {
                presenter.cancelCommand();
            } else if (modeActive) {
                exitMode();
            } else {
                close();
            }
            return;
        }

        if (modeActive) {
            // The mode decides what its keys mean; anything it declines is simply ignored here.
            mode.handleKey(e, { query, setQuery, exit: exitMode });
            return;
        }

        // Space on an EMPTY query enters the mode. Gated on `query === ""` so space stays an ordinary
        // character the moment there is anything to search — "new entry" must keep working.
        if (e.key === " " && query === "") {
            e.preventDefault();
            enterMode();
        }
    };

    return (
        <div
            role="presentation"
            onClick={close}
            className="fixed inset-0 z-overlay flex animate-in items-start justify-center bg-neutral-dark/50 fade-in duration-150"
            style={{ padding: "13vh 16px 16px", backdropFilter: "blur(2px)" }}
        >
            <div
                onClick={e => e.stopPropagation()}
                onKeyDown={onKeyDown}
                className="flex w-full animate-in flex-col overflow-hidden rounded-lg border border-neutral-dimmed bg-neutral-base shadow-xxl duration-150 zoom-in-95 slide-in-from-top-2"
                style={{ maxWidth: 680, maxHeight: "70vh", height: chrome?.tall ? "70vh" : "45vh" }}
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
                        // cmdk filtering is for the command list; a mode renders its own body.
                        shouldFilter={!chrome}
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                    >
                        {/* Input row — the same slot in every mode, so switching never moves it. */}
                        <div className="flex flex-none items-center gap-sm border-b border-neutral-subtle px-md py-sm-plus">
                            <Icon
                                icon={chrome ? chrome.icon : <SearchIcon />}
                                color={chrome ? chrome.iconColor : "neutral-light"}
                                size={"md"}
                                label={chrome ? chrome.iconLabel : "Search"}
                            />
                            {chrome?.badge ?? null}
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                value={query}
                                onValueChange={setQuery}
                                spellCheck={false}
                                placeholder={
                                    chrome ? chrome.placeholder : "Search for pages and actions…"
                                }
                                className="min-w-0 flex-1 border-0 bg-transparent text-lg text-neutral-primary outline-none"
                            />
                            <Kbd>esc</Kbd>
                        </div>

                        <div
                            ref={scrollRef}
                            className="p-xs-plus"
                            style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
                        >
                            {chrome ? (
                                mode.body
                            ) : (
                                <Command.List>
                                    <Command.Empty>
                                        <NoResults query={query} onAskAi={askAiFromQuery} />
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
                            )}
                        </div>

                        <PaletteFooter
                            label={chrome ? chrome.footerLabel : "Webiny command palette"}
                            hints={chrome ? chrome.hints : COMMAND_HINTS}
                        />
                    </Command>
                )}
            </div>
        </div>
    );
};

export const CommandPalette = createReactiveComponent(CommandPaletteBase);
