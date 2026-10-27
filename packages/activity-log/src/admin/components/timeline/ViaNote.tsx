import React from "react";
import { Alert, Text } from "@webiny/admin-ui";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";

/**
 * The second line that says what actually ran, when something acted on a person's behalf.
 *
 * Visually quiet on purpose: it qualifies the row above rather than competing with it. The
 * reader's question is "was someone actually sitting there", and this answers it without
 * displacing the name of the person accountable for the change.
 */
export const ViaNote = ({ text }: { text: string }) => (
    <Alert
        type={"info"}
        variant={"subtle"}
        icon={<PersonIcon />}
        className={"mt-xs px-xs-plus py-xs"}
    >
        <Text size={"sm"}>{text}</Text>
    </Alert>
);
