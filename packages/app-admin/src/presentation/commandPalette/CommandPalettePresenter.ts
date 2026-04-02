import { makeAutoObservable } from "mobx";
import {
    Command,
    CommandPalettePresenter as Abstraction,
    type CommandPaletteViewModel
} from "./abstractions.js";

export class CommandPalettePresenter implements Abstraction.Interface {
    private isOpen = false;
    private activeCommandName: string | null = null;
    private resolvedCommands: Command.Interface[] = [];

    constructor(private getCommands: () => Command.Interface[]) {
        makeAutoObservable(this);
    }

    init(): void {
        this.resolvedCommands = this.getCommands();
    }

    get shortcutKeys(): Record<string, (e: KeyboardEvent) => void> {
        const keys: Record<string, (e: KeyboardEvent) => void> = {};
        for (const cmd of this.resolvedCommands) {
            if (cmd.shortcut) {
                keys[cmd.shortcut] = (e: KeyboardEvent) => {
                    e.preventDefault();
                    this.useCommand(cmd.name);
                };
            }
        }
        return keys;
    }

    get vm(): CommandPaletteViewModel {
        const activeCmd =
            this.activeCommandName !== null
                ? this.resolvedCommands.find(c => c.name === this.activeCommandName)
                : null;

        return {
            isOpen: this.isOpen,
            commands: this.resolvedCommands.map(cmd => ({
                name: cmd.name,
                label: cmd.label,
                description: cmd.description,
                icon: cmd.icon,
                category: cmd.category,
                keywords: cmd.keywords,
                shortcut: cmd.shortcut,
                hasDetailView: Boolean(cmd.detailView)
            })),
            activeCommand:
                activeCmd && activeCmd.detailView
                    ? {
                          command: activeCmd,
                          DetailView: activeCmd.detailView
                      }
                    : null
        };
    }

    open(): void {
        this.resolvedCommands = this.getCommands();
        this.activeCommandName = null;
        this.isOpen = true;
    }

    close(): void {
        this.isOpen = false;
        this.activeCommandName = null;
    }

    toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    useCommand(name: string): void {
        const cmd = this.resolvedCommands.find(c => c.name === name);
        if (!cmd) {
            return;
        }

        if (cmd.detailView) {
            this.activeCommandName = name;
            this.isOpen = true;
        } else {
            cmd.execute();
            this.close();
        }
    }

    cancelCommand(): void {
        this.activeCommandName = null;
    }
}
