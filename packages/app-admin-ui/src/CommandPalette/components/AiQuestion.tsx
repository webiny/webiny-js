import React from "react";
import { Avatar } from "@webiny/admin-ui";

export interface AiQuestionProps {
    /** The signed-in user's initials. */
    initials: string;
    question: string;
    /** At the end of the line, such as Collapse on an earlier turn opened again. */
    actions?: React.ReactNode;
}

/** A question in the palette, as a heading with the asker's initials. */
export const AiQuestion = ({ initials, question, actions }: AiQuestionProps) => (
    <div className="flex items-center gap-sm-extra">
        <Avatar
            size="sm"
            variant="light"
            fallback={
                <Avatar.Fallback className="uppercase" delayMs={0}>
                    {initials}
                </Avatar.Fallback>
            }
        />
        <div className="min-w-0 flex-1 text-md font-semibold text-neutral-primary">{question}</div>
        {actions}
    </div>
);
