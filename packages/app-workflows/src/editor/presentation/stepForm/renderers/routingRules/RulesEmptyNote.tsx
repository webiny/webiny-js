import React from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";
import { ASSIGNMENT_STRATEGY_CARDS } from "../../assignmentStrategyCards.js";

export interface RulesEmptyNoteProps {
    // The strategy as the form holds it; null for one the editor does not know.
    strategy: string | null;
    disabled: boolean;
    onAdd(): void;
}

// The empty state of a list with no rule (design 4.2): what happens to a review instead, and the Add rule button.
export const RulesEmptyNote = ({ strategy, disabled, onAdd }: RulesEmptyNoteProps) => {
    let text: string = ASSIGNMENT_FORM_MESSAGES.emptyRulesPool;
    if (strategy !== "none") {
        const card = ASSIGNMENT_STRATEGY_CARDS.find(item => item.value === strategy);
        let strategyName: string = ASSIGNMENT_FORM_MESSAGES.emptyRulesUnknownStrategy;
        if (card !== undefined) {
            strategyName = card.name;
        }
        text = ASSIGNMENT_FORM_MESSAGES.emptyRulesStrategy(strategyName);
    }

    return (
        <div className={"flex flex-col items-start gap-sm"}>
            <Text size={"sm"}>{text}</Text>
            <Button
                variant={"tertiary"}
                size={"sm"}
                text={ASSIGNMENT_FORM_MESSAGES.addRule}
                icon={<AddIcon />}
                disabled={disabled}
                onClick={onAdd}
            />
        </div>
    );
};
