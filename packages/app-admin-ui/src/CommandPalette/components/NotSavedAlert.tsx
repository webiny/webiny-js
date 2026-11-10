import React from "react";
import { Alert } from "@webiny/admin-ui";

/**
 * Says a chat could not be saved. A warning, not an error: the conversation stays on screen, and
 * nothing the person typed is lost.
 */
export const NotSavedAlert = ({ reason }: { reason: string }) => (
    <Alert type="warning" variant="subtle" className="py-sm text-sm">
        {`**Not saved.** ${reason} The conversation is still here.`}
    </Alert>
);
