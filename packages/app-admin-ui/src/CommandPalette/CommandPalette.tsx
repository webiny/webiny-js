import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Command } from "cmdk";
import {
    AiChatFeature,
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
import { NAVIGATION_GROUP, PALETTE_HOTKEY_ZINDEX } from "./constants.js";
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
import { createAiMode } from "./modes/index.js";

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
    const { presenter } = useFeature(CommandPaletteFeature);
    const { menus } = useAdminConfig();
    const container = useContainer();
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { vm } = presenter;

    /*
     * One mode today. The palette talks to it only through `PaletteMode`, so everything the
     * assistant needs lives in `createAiMode` rather than here. A second mode turns this into a
     * registry; nothing above this line has to change for that.
     */
    const { presenter: aiChat } = useFeature(AiChatFeature);
    const aiMode = useMemo(() => createAiMode(aiChat), [aiChat]);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const close = useCallback(() => {
        presenter.close();
        aiMode.reset();
    }, [presenter, aiMode]);

    const enterAiMode = useCallback(() => presenter.enterAiMode(), [presenter]);

    const exitAiMode = useCallback(() => {
        presenter.exitAiMode();
        aiMode.reset();
    }, [presenter, aiMode]);

    const navigateTo = useCallback(
        (to: string) => {
            container.resolve(RouterGateway).pushState(to);
            close();
        },
        [container, close]
    );

    const runCommand = useCallback(
        (name: string) => {
            presenter.useCommand(name);
        },
        [presenter]
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

                if (!vm.aiModeActive) {
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
        [
            presenter,
            presenter.shortcutKeys,
            vm.isOpen,
            vm.activeCommand,
            vm.aiModeActive,
            enterAiMode,
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

    /*
     * The input is shared across modes, so focus has to be restored after the surrounding tree swaps.
     * Driven by the presenter's state rather than by each entry point, since a mode can now also be
     * entered by selecting the command, which never reaches this component.
     */
    useEffect(() => {
        if (!vm.aiModeActive) {
            return;
        }
        requestAnimationFrame(() => inputRef.current?.focus());
    }, [vm.aiModeActive]);

    /*
     * Let the active mode keep its own content in view. Runs on every render while a mode is showing,
     * because the body is what changes and the palette cannot tell what inside it moved.
     */
    useEffect(() => {
        if (!vm.aiModeActive || !scrollRef.current) {
            return;
        }
        aiMode.afterRender?.(scrollRef.current);
    });

    if (!vm.isOpen) {
        return null;
    }

    const active = vm.activeCommand;

    /* The one seeded entry: a search that found nothing becomes the question as-is. */
    const askAiFromQuery = () => {
        // Read before entering, because entering clears the query.
        const seed = vm.query;
        presenter.enterAiMode();
        aiMode.enter(seed);
    };

    /* Null while the command list is showing, which is what every `appearance ?` below tests for. */
    const appearance = vm.aiModeActive ? aiMode.appearance : null;

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (active) {
                presenter.cancelCommand();
            } else if (vm.aiModeActive) {
                exitAiMode();
            } else {
                close();
            }
            return;
        }

        if (vm.aiModeActive) {
            // The mode decides what its keys mean; anything it declines is simply ignored here.
            aiMode.handleKey(e, {
                query: vm.query,
                setQuery: q => presenter.setQuery(q),
                exit: exitAiMode
            });
            return;
        }

        // Space on an EMPTY query enters the aiMode. Gated on `query === ""` so space stays an ordinary
        // character the moment there is anything to search — "new entry" must keep working.
        if (e.key === " " && vm.query === "") {
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
                style={{
                    maxWidth: 680,
                    maxHeight: "70vh",
                    height: appearance?.tall ? "70vh" : "45vh"
                }}
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
                        shouldFilter={!appearance}
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                    >
                        {/* Input row — the same slot in every mode, so switching never moves it. */}
                        <div className="flex flex-none items-center gap-sm border-b border-neutral-subtle px-md py-sm-plus">
                            <Icon
                                icon={appearance ? appearance.icon : <SearchIcon />}
                                color={appearance ? appearance.iconColor : "neutral-light"}
                                size={"md"}
                                label={appearance ? appearance.iconLabel : "Search"}
                            />
                            {appearance?.badge ?? null}
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                value={vm.query}
                                onValueChange={q => presenter.setQuery(q)}
                                spellCheck={false}
                                placeholder={
                                    appearance
                                        ? appearance.placeholder
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
                            {appearance ? (
                                aiMode.body
                            ) : (
                                <Command.List>
                                    <Command.Empty>
                                        <NoResults query={vm.query} onAskAi={askAiFromQuery} />
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
                            label={appearance ? appearance.footerLabel : "Webiny command palette"}
                            hints={appearance ? appearance.hints : COMMAND_HINTS}
                        />
                    </Command>
                )}
            </div>
        </div>
    );
};

export const CommandPalette = createReactiveComponent(CommandPaletteBase);
