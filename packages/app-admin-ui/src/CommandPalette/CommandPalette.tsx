import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Command } from "cmdk";
import {
    AdminAssistantFeature,
    CommandPaletteFeature,
    createReactiveComponent,
    useAdminConfig,
    useFeatureFlags
} from "@webiny/app-admin";
import { useContainer, useFeature } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Icon } from "@webiny/admin-ui";
import { NAVIGATION_GROUP } from "./constants.js";
import type { CommandGroup } from "./types.js";
import { commandVmsToGroups, deriveNavigationRows } from "./deriveRows.js";
import { CommandDetail, Kbd, PaletteFooter } from "./components/index.js";
import { createAiMode, createCommandMode } from "./modes/index.js";
import { usePaletteHotkeys } from "./usePaletteHotkeys.js";

const CommandPaletteBase = () => {
    const { presenter } = useFeature(CommandPaletteFeature);
    const { menus } = useAdminConfig();
    const container = useContainer();
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { vm } = presenter;

    /*
     * The palette talks to its modes only through `PaletteMode`: the command list lives in
     * `createCommandMode` and the assistant in `createAiMode`, and nothing below branches on which
     * one is showing. A third mode turns the pick further down into a registry.
     */
    const { presenter: assistant } = useFeature(AdminAssistantFeature);
    const aiMode = useMemo(() => createAiMode(assistant), [assistant]);

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
        aiMode.reset();
    }, [presenter, aiMode]);

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

    usePaletteHotkeys({ presenter, close, aiEnabled });

    const groups = useMemo<CommandGroup[]>(() => {
        const result: CommandGroup[] = [];
        const navigationRows = deriveNavigationRows(menus, navigateTo);
        if (navigationRows.length > 0) {
            result.push({ title: NAVIGATION_GROUP, rows: navigationRows });
        }
        // Filtered on `entersAiMode` rather than on a command name, so a second mode needs no edit.
        const commands = aiEnabled ? vm.commands : vm.commands.filter(cmd => !cmd.entersAiMode);
        const commandGroups = commandVmsToGroups(commands, name => presenter.useCommand(name));
        result.push(...commandGroups);
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

        /*
         * A clicked suggestion or a Run button unmounts as soon as it is used, and focus falls to the
         * page. Take it back, so the next question or Enter lands in the input without a click.
         */
        if (document.activeElement === document.body) {
            inputRef.current?.focus();
        }
    });

    if (!vm.isOpen) {
        return null;
    }

    const active = vm.activeCommand;

    // The seed is read before entering, because entering clears the query.
    const askAi = (seed?: string) => {
        presenter.enterAiMode();
        aiMode.enter(seed);
    };

    const commandMode = createCommandMode({
        groups,
        query: vm.query,
        askAi: aiEnabled ? askAi : undefined
    });
    const mode = vm.aiModeActive ? aiMode : commandMode;
    const { appearance } = mode;

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

        // The mode decides what its keys mean; anything it declines is left to cmdk.
        mode.handleKey(e, {
            query: vm.query,
            setQuery: q => presenter.setQuery(q),
            exit: exitAiMode
        });
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
                className="flex w-full animate-in flex-col overflow-hidden border border-neutral-dimmed bg-neutral-base shadow-xxl duration-150 zoom-in-95 slide-in-from-top-2"
                style={{
                    maxWidth: 680,
                    maxHeight: "70vh",
                    height: appearance.tall ? "70vh" : "45vh",
                    borderRadius: 14
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
                        shouldFilter={appearance.filterable === true}
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
                    >
                        {/* Input row — the same slot in every mode, so switching never moves it. */}
                        <div className="flex flex-none items-center gap-sm-plus border-b border-neutral-subtle px-md py-md">
                            <Icon
                                icon={appearance.icon}
                                color={appearance.iconColor}
                                size={"md"}
                                label={appearance.iconLabel}
                            />
                            {appearance.badge ?? null}
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                value={vm.query}
                                onValueChange={q => presenter.setQuery(q)}
                                spellCheck={false}
                                placeholder={appearance.placeholder}
                                className="min-w-0 flex-1 border-0 bg-transparent text-lg text-neutral-primary outline-none"
                            />
                            <Kbd>esc</Kbd>
                        </div>

                        <div
                            ref={scrollRef}
                            className="p-xs-plus"
                            style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
                        >
                            {mode.body}
                        </div>

                        <PaletteFooter label={appearance.footerLabel} hints={appearance.hints} />
                    </Command>
                )}
            </div>
        </div>
    );
};

export const CommandPalette = createReactiveComponent(CommandPaletteBase);
