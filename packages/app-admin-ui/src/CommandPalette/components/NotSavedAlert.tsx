import React from "react";
import { Alert } from "@webiny/admin-ui";
import type { AiChatSaveFailure } from "@webiny/app-admin";

export interface NotSavedAlertProps {
    /** The server's message. */
    reason: string;
    /** Why a run was not saved. Null when it was opening a chat that failed, which no action fixes here. */
    failure: AiChatSaveFailure | null;
    /** Asks the newest question again, so its answer is saved this time. */
    onRetry: () => void;
    /** Leaves the conversation for a new chat, which saves again from its first answer. */
    onStartNew: () => void;
}

const textFor = (reason: string, failure: AiChatSaveFailure | null): string => {
    if (failure === "too-large") {
        return "**Not saved.** This chat is too large to store. Start a new chat to keep saving.";
    }
    if (failure === "rejected") {
        return `**Not saved.** ${reason} Ask again to save the last answer.`;
    }
    return `**Couldn't open this chat.** ${reason}`;
};

/**
 * Says the last answer was not saved, and offers the one thing that fixes it. A warning, not an
 * error: the conversation stays on screen.
 *
 * The assistant saves each answer itself, so an answer that was not saved is not in the chat it
 * continues from. Asking again answers it afresh and saves it; a chat too large to store needs a
 * new chat instead.
 */
export const NotSavedAlert = ({ reason, failure, onRetry, onStartNew }: NotSavedAlertProps) => {
    const text = textFor(reason, failure);
    let action: React.ReactElement | undefined;
    if (failure === "too-large") {
        action = <Alert.Action text="Start a new chat" onClick={onStartNew} />;
    } else if (failure) {
        action = <Alert.Action text="Ask again" onClick={onRetry} />;
    }

    return (
        <Alert type="warning" variant="subtle" className="py-sm text-sm" actions={action}>
            {text}
        </Alert>
    );
};
