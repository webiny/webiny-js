import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Command } from "cmdk";
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
import { Icon, ScrollArea, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ASSISTANT_GROUP, NAVIGATION_GROUP } from "./constants.js";
import type { CommandGroup } from "./types.js";
import { commandVmsToGroups, deriveNavigationRows } from "./deriveRows.js";
import {
    CommandDetail,
    CommandItemRow,
    GroupHeading,
    HintItem,
    HintList,
    Keys,
    NoResults,
    PaletteFooter,
    type Hint
} from "./components/index.js";
import { createAiMode } from "./modes/index.js";
import { usePaletteHotkeys } from "./usePaletteHotkeys.js";
import { useInitials } from "./useInitials.js";

const COMMAND_HINTS: Hint[] = [
    { keys: ["↑", "↓"], label: "to navigate" },
    { keys: ["↵"], label: "to open" }
];

const CLOSE_HINT: Hint = { keys: ["esc"], label: "to close" };

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

    /* The assistant's commands first, then navigation, then every other command group. */
    const groups = useMemo<CommandGroup[]>(() => {
        // Filtered on a flag rather than on command names, so a new assistant command needs no edit.
        const commands = aiEnabled
            ? vm.commands
            : vm.commands.filter(cmd => !cmd.requiresAssistant);
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
                className="flex w-full animate-in flex-col overflow-hidden rounded-xl bg-neutral-base shadow-xxl duration-150 zoom-in-95 slide-in-from-top-2"
                /*
                 * The command list and a conversation get a fixed height, because their body scrolls
                 * and the scroll area needs one. A mode that is not tall, such as the AI suggestions,
                 * fits its content instead: it is short and never scrolls, and a fixed height either
                 * cut its last row off or left the panel half empty.
                 */
                style={{
                    maxWidth: 640,
                    maxHeight: "70vh",
                    height: appearance ? (appearance.tall ? "70vh" : undefined) : "45vh"
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
                        {/*
                         * Input row — the same slot in every mode, so switching never moves it. There is
                         * no heading: the tag says which mode is active, and esc or a click outside closes.
                         */}
                        <div className="flex flex-none items-center gap-sm border-b border-neutral-dimmed-darker px-lg py-md">
                            <Icon
                                icon={appearance ? appearance.icon : <SearchIcon />}
                                color={appearance ? appearance.iconColor : "neutral-light"}
                                size={"sm"}
                                label={appearance ? appearance.iconLabel : "Search"}
                            />
                            <Tag
                                className="shrink-0"
                                variant={
                                    appearance ? appearance.tagVariant : "neutral-base-outline"
                                }
                                content={appearance ? appearance.tag : "Commands"}
                            />
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                value={vm.query}
                                onValueChange={q => presenter.setQuery(q)}
                                spellCheck={false}
                                placeholder={placeholder}
                                className="min-w-0 flex-1 border-0 bg-transparent text-md text-neutral-primary outline-none placeholder:text-neutral-muted"
                            />
                            {/* Esc leaves a mode, so that is the key a mode shows; ⌘K opens the list. */}
                            <Keys keys={appearance ? ["esc"] : ["⌘", "K"]} />
                        </div>

                        {/*
                         * The body scrolls inside a `ScrollArea`, so it shows the same scrollbar as
                         * the rest of the admin instead of the operating system's.
                         */}
                        <ScrollArea
                            className="min-h-0 flex-1"
                            viewportClassName="p-md [&>div]:!block"
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
                                            className="mb-md last:mb-0 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-xxs"
                                        >
                                            {group.rows.map(row => (
                                                <CommandItemRow key={row.key} row={row} />
                                            ))}
                                        </Command.Group>
                                    ))}
                                </Command.List>
                            )}
                        </ScrollArea>

                        {/*
                         * The command list leads with how to move through it. A mode leads with who
                         * is answering, and its keys sit at the end, where the command list has esc.
                         */}
                        {appearance ? (
                            <PaletteFooter
                                start={
                                    <Text size="sm" className="truncate text-neutral-muted">
                                        {appearance.footerLabel}
                                    </Text>
                                }
                                end={<HintList hints={appearance.hints} />}
                            />
                        ) : (
                            <PaletteFooter
                                start={<HintList hints={COMMAND_HINTS} />}
                                end={<HintItem hint={CLOSE_HINT} />}
                            />
                        )}
                    </Command>
                )}
            </div>
        </div>
    );
};

export const CommandPalette = createReactiveComponent(CommandPaletteBase);
