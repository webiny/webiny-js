import React from "react";
import { Text } from "@webiny/admin-ui";
import type { AssignmentStrategyCard } from "../../AssignmentStrategyCard.js";
import { WRAPPING_LABEL_CLASS_NAME } from "../wrappingLabelClassName.js";

export interface StrategyCardLabelProps {
    card: AssignmentStrategyCard;
}

// The content of a strategy radio item: the name and its description (R305).
export const StrategyCardLabel = ({ card }: StrategyCardLabelProps) => {
    return (
        <span className={`flex flex-col gap-xxs ${WRAPPING_LABEL_CLASS_NAME}`}>
            <Text className={"break-words"}>{card.name}</Text>
            <Text size={"sm"} className={"break-words"}>
                {card.description}
            </Text>
        </span>
    );
};
