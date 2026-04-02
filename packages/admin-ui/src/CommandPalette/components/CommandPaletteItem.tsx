import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "~/utils.js";
import type { CommandPaletteCommand } from "../types.js";

interface CommandPaletteItemProps {
    command: CommandPaletteCommand;
    onSelect: () => void;
}

const CommandPaletteItem = ({ command, onSelect }: CommandPaletteItemProps) => {
    return (
        <CommandPrimitive.Item
            value={command.name}
            keywords={command.keywords}
            onSelect={onSelect}
            className={cn(
                "flex items-center gap-sm-extra px-lg py-sm-extra cursor-default select-none",
                "text-md text-neutral-primary",
                "data-[selected=true]:bg-neutral-dimmed",
                "outline-none rounded-md mx-sm-extra"
            )}
        >
            {command.icon && (
                <span className="flex items-center justify-center w-lg h-lg shrink-0 fill-neutral-xstrong">
                    {command.icon}
                </span>
            )}
            <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate">{command.label}</span>
                {command.description && (
                    <span className="text-sm text-neutral-secondary truncate">
                        {command.description}
                    </span>
                )}
            </div>
            {command.shortcut && (
                <kbd
                    className={cn(
                        "ml-auto shrink-0 text-xs text-neutral-secondary",
                        "bg-neutral-dimmed px-xs-plus py-xs rounded"
                    )}
                >
                    {command.shortcut}
                </kbd>
            )}
        </CommandPrimitive.Item>
    );
};

export { CommandPaletteItem };
