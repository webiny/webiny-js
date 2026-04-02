import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { ReactComponent as ArrowLeftIcon } from "@webiny/icons/arrow_back.svg";
import { makeDecoratable, cn, withStaticProps } from "~/utils.js";
import type { CommandPaletteProps } from "./types.js";
import { CommandPaletteContent } from "./components/CommandPaletteContent.js";
import { CommandPaletteSearch } from "./components/CommandPaletteSearch.js";
import { CommandPaletteList } from "./components/CommandPaletteList.js";

const CommandPaletteBase = ({
    open,
    onOpenChange,
    commands,
    detailView,
    onSelectCommand,
    onCancelCommand,
    placeholder
}: CommandPaletteProps) => {
    const handleOpenChange = React.useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                onCancelCommand();
            }
            onOpenChange(nextOpen);
        },
        [onOpenChange, onCancelCommand]
    );

    return (
        <CommandPaletteContent open={open} onOpenChange={handleOpenChange}>
            {detailView ? (
                <div>
                    <div
                        className={cn(
                            "flex items-center gap-sm px-md py-sm border-b border-neutral-muted"
                        )}
                    >
                        <button
                            type="button"
                            onClick={onCancelCommand}
                            className={cn(
                                "flex items-center justify-center w-lg h-lg rounded",
                                "hover:bg-neutral-dimmed text-neutral-secondary",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-default"
                            )}
                        >
                            <ArrowLeftIcon className="w-md h-md fill-current" />
                        </button>
                        <div className="flex items-center gap-sm-extra min-w-0">
                            {detailView.icon && (
                                <span className="flex items-center justify-center w-md-plus h-md-plus shrink-0 fill-neutral-xstrong">
                                    {detailView.icon}
                                </span>
                            )}
                            <span className="text-md font-semibold text-neutral-primary truncate">
                                {detailView.label}
                            </span>
                        </div>
                    </div>
                    {detailView.element}
                </div>
            ) : (
                <CommandPrimitive className="flex flex-col outline-none">
                    <CommandPaletteSearch placeholder={placeholder} />
                    <CommandPaletteList commands={commands} onSelect={onSelectCommand} />
                </CommandPrimitive>
            )}
        </CommandPaletteContent>
    );
};

CommandPaletteBase.displayName = "CommandPalette";

const DecoratableCommandPalette = makeDecoratable("CommandPalette", CommandPaletteBase);

const CommandPalette = withStaticProps(DecoratableCommandPalette, {});

export { CommandPalette, type CommandPaletteProps };
