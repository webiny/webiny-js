import React from "react";
import { cn } from "@webiny/admin-ui";
import type { AssignmentStrategyCard } from "../../AssignmentStrategyCard.js";

export interface StrategyCardLabelProps {
    card: AssignmentStrategyCard;
    selected: boolean;
}

// The content of a strategy radio item: the card (R305). The selected card has the accent border and the subtle primary background.
export const StrategyCardLabel = ({ card, selected }: StrategyCardLabelProps) => {
    const cardClass = cn(
        "flex flex-col gap-xxs rounded-md border-sm px-md py-sm",
        selected && "border-accent-default bg-primary-subtle",
        !selected && "border-neutral-muted bg-neutral-base"
    );

    return (
        <span className={cardClass}>
            <span className={"font-semibold"}>{card.name}</span>
            <span className={"text-sm text-neutral-strong"}>{card.description}</span>
        </span>
    );
};
