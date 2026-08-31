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
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as BackspaceIcon } from "@webiny/icons/backspace.svg";
import { AI_COMMAND_NAME, NAVIGATION_GROUP, PALETTE_HOTKEY_ZINDEX } from "./constants.js";
import type { CommandGroup } from "./types.js";
import { commandVmsToGroups, deriveNavigationRows } from "./deriveRows.js";
import {
    AiModeBadge,
    AiSuggestions,
    AiTurn,
    CommandDetail,
    CommandItemRow,
    GroupHeading,
    HintIcon,
    Kbd,
    NoResults,
    PaletteFooter,
    type Hint
} from "./components/index.js";
import { useAiChat } from "./useAiChat.js";

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

const AI_HINTS: Hint[] = [
    { keys: <HintIcon element={<ReturnIcon />} />, label: "Ask" },
    { keys: <HintIcon element={<BackspaceIcon />} />, label: "Commands" },
    { keys: "esc", label: "Close" }
];

const CommandPaletteBase = () => {
    const [query, setQuery] = useState("");
    const [aiMode, setAiMode] = useState(false);
    const { presenter } = useFeature(CommandPaletteFeature);
    const { menus } = useAdminConfig();
    const container = useContainer();
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { vm } = presenter;
    const ai = useAiChat();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const close = useCallback(() => {
        presenter.close();
        setQuery("");
        setAiMode(false);
        ai.reset();
    }, [presenter, ai]);

    const enterAiMode = useCallback(
        (seed?: string) => {
            setAiMode(true);
            setQuery("");
            if (seed?.trim()) {
                ai.ask(seed);
            }
            // The input is shared across modes, so focus has to be restored explicitly after the
            // surrounding tree swaps.
            requestAnimationFrame(() => inputRef.current?.focus());
        },
        [ai]
    );

    const exitAiMode = useCallback(() => {
        setAiMode(false);
        setQuery("");
        ai.reset();
    }, [ai]);

    const navigateTo = useCallback(
        (to: string) => {
            container.resolve(RouterGateway).pushState(to);
            close();
        },
        [container, close]
    );

    const runCommand = useCallback(
        (name: string) => {
            // The AI command is a palette MODE, not an action — it needs the shared input row, so the
            // palette handles it here instead of letting the presenter open a detail view.
            if (name === AI_COMMAND_NAME) {
                enterAiMode();
                return;
            }
            presenter.useCommand(name);
        },
        [presenter, enterAiMode]
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
                    setAiMode(false);
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

                if (!aiMode) {
                    enterAiMode();
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
        [presenter, presenter.shortcutKeys, vm.isOpen, vm.activeCommand, aiMode, enterAiMode, close]
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

    // Keep the newest turn in view; answers are long enough to push earlier ones off-screen.
    useEffect(() => {
        if (aiMode) {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
        }
    }, [aiMode, ai.turns, ai.busy]);

    if (!vm.isOpen) {
        return null;
    }

    const active = vm.activeCommand;

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (active) {
                presenter.cancelCommand();
            } else if (aiMode) {
                exitAiMode();
            } else {
                close();
            }
            return;
        }

        if (aiMode) {
            if (e.key === "Enter") {
                e.preventDefault();
                ai.ask(query);
                setQuery("");
                return;
            }
            // Backspace on an empty input leaves AI mode, mirroring how space entered it.
            if (e.key === "Backspace" && query === "") {
                e.preventDefault();
                exitAiMode();
            }
            return;
        }

        // Space on an EMPTY query enters AI mode. Gated on `query === ""` so space stays an ordinary
        // character the moment there is anything to search — "new entry" must keep working.
        if (e.key === " " && query === "") {
            e.preventDefault();
            enterAiMode();
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
                style={{ maxWidth: 680, maxHeight: "70vh", height: aiMode ? "70vh" : "45vh" }}
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
                        shouldFilter={!aiMode}
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                    >
                        {/* Input row — the same slot in every mode, so switching never moves it. */}
                        <div className="flex flex-none items-center gap-sm border-b border-neutral-subtle px-md py-sm-plus">
                            <Icon
                                icon={aiMode ? <AiIcon /> : <SearchIcon />}
                                color={aiMode ? "accent" : "neutral-light"}
                                size={"md"}
                                label={aiMode ? "Ask AI" : "Search"}
                            />
                            {aiMode ? <AiModeBadge /> : null}
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                value={query}
                                onValueChange={setQuery}
                                spellCheck={false}
                                placeholder={
                                    aiMode
                                        ? ai.turns.length
                                            ? "Ask a follow-up…"
                                            : "Ask about your content…"
                                        : "Search for pages and actions…"
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
                            {aiMode ? (
                                ai.turns.length === 0 ? (
                                    <AiSuggestions onAsk={ai.ask} />
                                ) : (
                                    ai.turns.map((turn, index) => (
                                        <AiTurn
                                            key={index}
                                            turn={turn}
                                            initials="You"
                                            busy={ai.busy}
                                            onApprove={() => ai.decide(index, true)}
                                            onReject={() => ai.decide(index, false)}
                                        />
                                    ))
                                )
                            ) : (
                                <Command.List>
                                    <Command.Empty>
                                        <NoResults
                                            query={query}
                                            onAskAi={() => enterAiMode(query)}
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
                            )}
                        </div>

                        <PaletteFooter
                            label={aiMode ? "Webiny AI" : "Webiny command palette"}
                            hints={aiMode ? AI_HINTS : COMMAND_HINTS}
                        />
                    </Command>
                )}
            </div>
        </div>
    );
};

export const CommandPalette = createReactiveComponent(CommandPaletteBase);
