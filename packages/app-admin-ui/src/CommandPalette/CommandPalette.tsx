import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Command } from "cmdk";
import { cn } from "@webiny/admin-ui";
import {
    AdminAssistantFeature,
    AiChatsPanelFeature,
    CommandPaletteFeature,
    createReactiveComponent,
    useAdminConfig,
    useFeatureFlags
} from "@webiny/app-admin";
import { useContainer, useFeature } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Icon } from "@webiny/admin-ui";
import { Kbd } from "@webiny/admin-ui";
import { ScrollArea } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ASSISTANT_GROUP } from "./constants.js";
import { NAVIGATION_GROUP } from "./constants.js";
import type { CommandGroup } from "./types.js";
import { commandVmsToGroups, deriveNavigationRows } from "./deriveRows.js";
import {
    CommandDetail,
    CommandItemRow,
    GroupHeading,
    NoResults,
    PaletteFooter,
    type Hint
} from "./components/index.js";
import { createAiMode } from "./modes/index.js";
import { usePaletteHotkeys } from "./usePaletteHotkeys.js";
import { useInitials } from "./useInitials.js";

const NAVIGATE_HINTS: Hint[] = [
    { keys: ["↑", "↓"], label: "to navigate" },
    { keys: ["↵"], label: "to open" }
];

const ASK_AI_HINT: Hint = { keys: ["space"], label: "to ask AI" };

const CLOSE_HINT: Hint = { keys: ["esc"], label: "to close" };

/*
 * The design's shadow-xl, which is not the admin-ui `shadow-xl` token. Changing that token would
 * change every modal, so the palette carries the value itself.
 */
const PANEL_SHADOW = "shadow-[0_10px_10px_-5px_rgba(0,0,0,0.04),0_20px_25px_-5px_rgba(0,0,0,0.1)]";

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
    const { presenter: assistant } = useFeature(AdminAssistantFeature);
    const { presenter: chatsPanel } = useFeature(AiChatsPanelFeature);
    const initials = useInitials();

    /*
     * Closes the palette without dropping the conversation, which the panel shows from the same
     * presenter. Every turn is already saved, so the panel lists it as the open chat.
     */
    const continueInChats = useCallback(() => {
        presenter.close();
        chatsPanel.open();
    }, [presenter, chatsPanel]);

    const aiMode = useMemo(
        () => createAiMode(assistant, initials, continueInChats),
        [assistant, initials, continueInChats]
    );

    /*
     * The assistant is licensed separately, and the api registers no route without it. Checked here
     * rather than at registration because admin flags are fetched, so they are not known when the
     * container is built.
     */
    const aiEnabled = useFeatureFlags().isEnabled("aiPowerups.adminAssistant");

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const close = useCallback(() => {
        presenter.close();
        // While the chats panel is open, the conversation is the panel's too, so it stays.
        if (!chatsPanel.vm.isOpen) {
            aiMode.reset();
        }
    }, [presenter, aiMode, chatsPanel]);

    const exitAiMode = useCallback(() => {
        presenter.exitAiMode();
        if (!chatsPanel.vm.isOpen) {
            aiMode.reset();
        }
    }, [presenter, aiMode, chatsPanel]);

    const navigateTo = useCallback(
        (to: string) => {
            container.resolve(RouterGateway).pushState(to);
            close();
        },
        [container, close]
    );

    usePaletteHotkeys({ presenter, close, aiEnabled });

    // The assistant's commands first, then navigation, then every other command group.
    const groups = useMemo<CommandGroup[]>(() => {
        // Filtered on a flag rather than on command names, so a new assistant command needs no edit.
        let commands = vm.commands;
        if (!aiEnabled) {
            commands = vm.commands.filter(cmd => !cmd.requiresAssistant);
        }
        const commandGroups = commandVmsToGroups(commands, name => presenter.useCommand(name));
        const navigationRows = deriveNavigationRows(menus, navigateTo);

        const result = commandGroups.filter(group => group.title === ASSISTANT_GROUP);
        if (navigationRows.length > 0) {
            result.push({ title: NAVIGATION_GROUP, rows: navigationRows });
        }
        result.push(...commandGroups.filter(group => group.title !== ASSISTANT_GROUP));
        return result;
    }, [menus, vm.commands, navigateTo, presenter, aiEnabled]);

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
     * Many buttons in the palette replace themselves when clicked: a suggestion or a follow-up turns
     * into a question, a collapsed turn into an open one. Focus then falls back to the page, where
     * Esc, Cmd+Enter and the next question never reach the palette. So after a click, focus goes
     * back to the input if it left the palette, unless the click ended a text selection, which
     * focusing the input would clear.
     */
    const keepFocusInPalette = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const panel = e.currentTarget;
        requestAnimationFrame(() => {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) {
                return;
            }
            if (!panel.contains(document.activeElement)) {
                inputRef.current?.focus();
            }
        });
    };

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
    const placeholder = appearance ? appearance.placeholder : "Search commands or content…";

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
        if (e.key === " " && vm.query === "" && aiEnabled) {
            e.preventDefault();
            presenter.enterAiMode();
        }
    };

    const commandHints = [...NAVIGATE_HINTS, CLOSE_HINT];
    if (aiEnabled) {
        commandHints.splice(NAVIGATE_HINTS.length, 0, ASK_AI_HINT);
    }

    /*
     * 108px from the top, 64px under the header, and never centred: a centred palette jumps every time
     * its results change height. The panel fits its body up to the window's height, and the body
     * scrolls past that.
     */
    return (
        <div
            role="presentation"
            onClick={close}
            className="fixed inset-0 z-overlay flex animate-in items-start justify-center bg-neutral-dark/50 px-md pt-[108px] fade-in duration-150"
        >
            <div
                onClick={keepFocusInPalette}
                onKeyDown={onKeyDown}
                className={cn(
                    "flex max-h-[calc(100vh-124px)] w-full max-w-[720px] animate-in flex-col overflow-hidden rounded-xl border-sm border-neutral-dimmed bg-neutral-base duration-150 zoom-in-95 slide-in-from-top-2",
                    PANEL_SHADOW
                )}
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
                        className="flex min-h-0 flex-col"
                    >
                        {/*
                         * Input row: the same slot in every mode, so switching never moves it. There is
                         * no heading: the chip says which mode is active, and esc or a click outside
                         * closes.
                         */}
                        <div className="flex h-[56px] flex-none items-center gap-sm-extra border-b-sm border-neutral-dimmed px-md">
                            <Icon
                                icon={appearance ? appearance.icon : <SearchIcon />}
                                color={appearance ? appearance.iconColor : "neutral-strong"}
                                size={"md"}
                                label={appearance ? appearance.iconLabel : "Search"}
                            />
                            <Tag
                                className="shrink-0"
                                variant={appearance ? appearance.tagVariant : "neutral-light"}
                                content={appearance ? appearance.tag : "Commands"}
                            />
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                value={vm.query}
                                onValueChange={q => presenter.setQuery(q)}
                                spellCheck={false}
                                placeholder={placeholder}
                                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-lg leading-[22px] text-neutral-primary outline-none placeholder:text-neutral-muted"
                            />
                            {/* Esc leaves a mode, so that is the key a mode shows; ⌘K opens the list. */}
                            <Kbd keys={appearance ? ["esc"] : ["⌘", "K"]} />
                        </div>

                        {/*
                         * The body scrolls inside a `ScrollArea`, so it shows the same scrollbar as
                         * the rest of the admin instead of the operating system's. `[&>div]:!block`
                         * overrides Radix's `display: table` wrapper, which grows to fit its widest
                         * child and would widen the palette past a wide table.
                         */}
                        <ScrollArea
                            className="min-h-0 flex-initial"
                            viewportClassName={cn(
                                "max-h-[calc(100vh-240px)] [&>div]:!block",
                                appearance && !appearance.listBody ? "p-md" : "p-sm"
                            )}
                            viewportRef={scrollRef}
                        >
                            {appearance ? (
                                aiMode.body
                            ) : (
                                <Command.List>
                                    <Command.Empty>
                                        <NoResults
                                            query={vm.query}
                                            onAskAi={aiEnabled ? askAiFromQuery : undefined}
                                        />
                                    </Command.Empty>

                                    {groups.map(group => (
                                        <Command.Group
                                            key={group.title}
                                            heading={<GroupHeading title={group.title} />}
                                            className="[&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-xxs"
                                        >
                                            {group.rows.map(row => (
                                                <CommandItemRow key={row.key} row={row} />
                                            ))}
                                        </Command.Group>
                                    ))}
                                </Command.List>
                            )}
                        </ScrollArea>

                        <PaletteFooter
                            start={appearance ? appearance.footerStart : undefined}
                            hints={appearance ? appearance.hints : commandHints}
                        />
                    </Command>
                )}
            </div>
        </div>
    );
};

export const CommandPalette = createReactiveComponent(CommandPaletteBase);
