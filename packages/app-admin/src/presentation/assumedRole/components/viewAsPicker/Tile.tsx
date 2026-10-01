import React from "react";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";

export const Tile = ({ selected, icon }: { selected: boolean; icon: React.ReactElement }) => {
    let tile = "border-neutral-dimmed bg-neutral-subtle";
    if (selected) {
        tile = "border-primary bg-primary-subtle";
    }

    return (
        <div className={cn("grid size-xl shrink-0 place-items-center rounded-md border", tile)}>
            <Icon
                icon={icon}
                size={"sm"}
                color={selected ? "accent" : "neutral-strong"}
                label={""}
            />
        </div>
    );
};
