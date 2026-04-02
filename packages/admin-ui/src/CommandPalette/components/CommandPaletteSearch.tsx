import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "~/utils.js";

interface CommandPaletteSearchProps {
    placeholder?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

const CommandPaletteSearch = ({
    placeholder = "Search commands…",
    ...props
}: CommandPaletteSearchProps) => {
    return (
        <div className={cn("flex items-center gap-sm px-lg border-b border-neutral-muted")}>
            <CommandPrimitive.Input
                autoFocus={true}
                className={cn(
                    "flex w-full py-md bg-transparent text-md",
                    "placeholder:text-neutral-disabled",
                    "outline-none border-none"
                )}
                placeholder={placeholder}
                {...props}
            />
        </div>
    );
};

export { CommandPaletteSearch };
