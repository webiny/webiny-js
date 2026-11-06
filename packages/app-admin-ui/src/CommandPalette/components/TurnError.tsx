import React from "react";
import { Alert } from "@webiny/admin-ui";

/**
 * A failed turn, in place of its answer. An alert of its own rather than red text inside the answer,
 * so a failure reads as the outcome of the turn. Most messages here name the setting to fix, so they
 * are shown as sent.
 */
export const TurnError = ({ message }: { message: string }) => (
    <Alert type="danger" variant="subtle">
        {message}
    </Alert>
);
