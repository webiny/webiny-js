import React from "react";
import { Alert } from "@webiny/admin-ui";
import type { AuthMessage } from "../abstractions.js";

export interface MessageProps {
    message: AuthMessage | null;
}

/**
 * The one place a screen says anything back to the user. Shared by all four so that a success, a
 * refusal and a misconfiguration look the same wherever they happen.
 */
export const Message = ({ message }: MessageProps) => {
    if (!message) {
        return null;
    }

    return (
        <div className={"mb-lg"}>
            <Alert title={message.title} type={message.type}>
                {message.text}
            </Alert>
        </div>
    );
};
