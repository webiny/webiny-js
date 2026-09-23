import type React from "react";
import { createAbstraction } from "@webiny/feature/admin";
import { Abstraction } from "@webiny/di";

export interface CommandDetailProps {
    command: ICommand;
    onClose: () => void;
    onBack: () => void;
}

/**
 * A command registered with the command palette via dependency injection. Register an
 * implementation with `Command.createImplementation(...)` and add it to the container;
 * the palette resolves all of them with `container.resolveAll(Command)`.
 */
export interface ICommand {
    name: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    category?: string;
    keywords?: string[];
    /* Global hotkey (is-hotkey syntax, e.g. "cmd+shift+m") that runs this command. */
    shortcut?: string;
    /* Omitted by a command that only selects a mode; there is no action to run. */
    execute?(params?: unknown): void | Promise<void>;
    /* Optional React view rendered inside the palette when the command is selected. */
    detailView?: React.ComponentType<CommandDetailProps>;
    /*
     * The detail view renders the whole panel (its own input row, body and footer) instead of
     * sitting under the palette's back-button header. For a view that is really a second list
     * (type to filter, arrows, enter) and should read as the palette itself rather than as a form
     * placed inside it. The panel also sizes to its content instead of a fixed height, so a short
     * list doesn't float in empty space.
     */
    detailViewOwnsPanel?: boolean;
    /*
     * Selecting this command switches the palette into AI mode rather than doing something. A mode
     * needs the shared input row, so the palette stays open and `execute` is never called.
     *
     * Named after the one mode that exists. If a second one ever arrives, this becomes
     * `entersMode: "adminAssistant"` and the palette looks the mode up by name instead of hardcoding it.
     */
    entersAiMode?: boolean;
}

export const Command = createAbstraction<ICommand>("Command");

export namespace Command {
    export type Interface = ICommand;
    export type DetailProps = CommandDetailProps;
}

export interface CommandItemVm {
    name: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    category?: string;
    keywords?: string[];
    shortcut?: string;
    hasDetailView: boolean;
    /** Selecting this opens a second list in place of the palette's, rather than a form. */
    drillsIn: boolean;
    /** Selecting this switches the palette into AI mode. Lets a caller hide it when AI is off. */
    entersAiMode: boolean;
}

export interface ActiveCommandVm {
    command: ICommand;
    DetailView: React.ComponentType<CommandDetailProps>;
}

export interface CommandPaletteViewModel {
    isOpen: boolean;
    /**
     * A mode is showing instead of the command list. The palette keeps ONE input row across every
     * mode, so this is the palette's state rather than the mode's.
     */
    aiModeActive: boolean;
    /**
     * What the user has typed. Owned here rather than by the component because it is cleared
     * whenever the palette opens, closes, or enters or leaves a mode.
     */
    query: string;
    commands: CommandItemVm[];
    activeCommand: ActiveCommandVm | null;
}

export interface ICommandPalettePresenter {
    vm: CommandPaletteViewModel;
    shortcutKeys: Record<string, (e: KeyboardEvent) => void>;
    init(): void;
    open(): void;
    close(): void;
    toggle(): void;
    useCommand(name: string): void;
    cancelCommand(): void;
    enterAiMode(): void;
    exitAiMode(): void;
    setQuery(query: string): void;
}

export const CommandPalettePresenter = new Abstraction<ICommandPalettePresenter>(
    "CommandPalettePresenter"
);

export namespace CommandPalettePresenter {
    export type Interface = ICommandPalettePresenter;
    export type ViewModel = CommandPaletteViewModel;
}
