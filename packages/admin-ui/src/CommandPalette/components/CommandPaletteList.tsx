import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "~/utils.js";
import type { CommandPaletteCommand } from "../types.js";
import { CommandPaletteItem } from "./CommandPaletteItem.js";

interface CommandPaletteListProps {
    commands: CommandPaletteCommand[];
    onSelect: (name: string) => void;
}

const CommandPaletteList = ({ commands, onSelect }: CommandPaletteListProps) => {
    const grouped = React.useMemo(() => {
        const groups = new Map<string, CommandPaletteCommand[]>();
        for (const cmd of commands) {
            const category = cmd.category ?? "";
            const list = groups.get(category) ?? [];
            list.push(cmd);
            groups.set(category, list);
        }
        return groups;
    }, [commands]);

    return (
        <CommandPrimitive.List
            className={cn(
                "max-h-[360px] overflow-y-auto overflow-x-hidden py-sm-extra",
                "bg-neutral-base text-neutral-strong"
            )}
        >
            <CommandPrimitive.Empty className="py-xl text-center text-sm text-neutral-secondary">
                No commands found.
            </CommandPrimitive.Empty>
            {[...grouped.entries()].map(([category, cmds]) => {
                if (category === "") {
                    return cmds.map(cmd => (
                        <CommandPaletteItem
                            key={cmd.name}
                            command={cmd}
                            onSelect={() => onSelect(cmd.name)}
                        />
                    ));
                }
                return (
                    <CommandPrimitive.Group
                        key={category}
                        heading={category}
                        className={cn(
                            "[&_[cmdk-group-heading]]:px-lg [&_[cmdk-group-heading]]:py-sm-extra",
                            "[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold",
                            "[&_[cmdk-group-heading]]:text-neutral-secondary [&_[cmdk-group-heading]]:uppercase",
                            "[&_[cmdk-group-heading]]:tracking-wide"
                        )}
                    >
                        {cmds.map(cmd => (
                            <CommandPaletteItem
                                key={cmd.name}
                                command={cmd}
                                onSelect={() => onSelect(cmd.name)}
                            />
                        ))}
                    </CommandPrimitive.Group>
                );
            })}
        </CommandPrimitive.List>
    );
};

export { CommandPaletteList };
