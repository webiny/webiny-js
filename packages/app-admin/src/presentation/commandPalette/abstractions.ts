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
    execute(params?: unknown): void | Promise<void>;
    /* Optional React view rendered inside the palette when the command is selected. */
    detailView?: React.ComponentType<CommandDetailProps>;
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
}

export interface ActiveCommandVm {
    command: ICommand;
    DetailView: React.ComponentType<CommandDetailProps>;
}

export interface CommandPaletteViewModel {
    isOpen: boolean;
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
}

export const CommandPalettePresenter = new Abstraction<ICommandPalettePresenter>(
    "CommandPalettePresenter"
);

export namespace CommandPalettePresenter {
    export type Interface = ICommandPalettePresenter;
    export type ViewModel = CommandPaletteViewModel;
}
