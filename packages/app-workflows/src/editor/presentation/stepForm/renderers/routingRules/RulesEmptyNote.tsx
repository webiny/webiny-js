import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";

export interface RulesEmptyNoteProps {
    // The strategy as the form holds it; null for one the editor does not know.
    strategy: string | null;
}

// The note of a list with no rule (design 4.2): what happens to a review instead.
export const RulesEmptyNote = ({ strategy }: RulesEmptyNoteProps) => {
    let consequence: string = ASSIGNMENT_FORM_MESSAGES.emptyRulesStrategy;
    if (strategy === "none") {
        consequence = ASSIGNMENT_FORM_MESSAGES.emptyRulesPool;
    }
    const text = `${ASSIGNMENT_FORM_MESSAGES.emptyRulesLead}${consequence}`;

    return (
        <Alert type={"info"} variant={"subtle"}>
            <Text size={"sm"}>{text}</Text>
        </Alert>
    );
};
