import React from "react";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/error_outline.svg";

/**
 * Accessibility warnings are advisory. They get a small inline marker and a plain sentence — they
 * never block, never turn a panel red, and never open a modal. See the design brief, section 11.
 */
export const WarningMarker = () => {
    return <WarningIcon className="size-4 flex-none fill-warning-default" aria-label="Warning" />;
};

interface WarningNoteProps {
    message: string;
    /** Aligns the note under the row's label rather than its swatch. */
    indented?: boolean;
}

export const WarningNote = ({ message, indented = true }: WarningNoteProps) => {
    return (
        <Text
            size="sm"
            as="div"
            className={`block text-neutral-strong ${indented ? "pl-[32px]" : ""} pb-xs`}
        >
            {message}
        </Text>
    );
};
