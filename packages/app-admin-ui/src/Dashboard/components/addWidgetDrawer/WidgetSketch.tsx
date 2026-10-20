import React from "react";
import { cn } from "@webiny/admin-ui";

// A tiny sketch of a widget card, for widgets that don't provide a preview.
export const WidgetSketch = ({ added }: { added: boolean }) => {
    return (
        <div
            className={cn(
                "flex h-[58px] w-[84px] flex-none flex-col gap-xxs overflow-hidden rounded-sm",
                "border-sm border-neutral-muted bg-neutral-base p-xs"
            )}
        >
            <div className={"flex items-center gap-[3px]"}>
                <span
                    className={cn(
                        "size-[7px] rounded-[2px]",
                        added ? "bg-neutral-strong" : "bg-primary"
                    )}
                />
                <span className={"h-[4px] w-[30px] rounded-[2px] bg-neutral-strong/40"} />
            </div>
            <span className={"h-[4px] w-full rounded-[2px] bg-neutral-muted"} />
            <span className={"h-[4px] w-3/4 rounded-[2px] bg-neutral-muted"} />
            <span className={"mt-[2px] h-[12px] w-[40px] rounded-[3px] bg-neutral-dimmed"} />
        </div>
    );
};
