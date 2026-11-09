import React from "react";
import { Alert } from "@webiny/admin-ui";
import type { AiChatSaveFailure } from "@webiny/app-admin";

export interface NotSavedAlertProps {
    /** The server's message, or the client's when the request never got an answer. */
    reason: string;
    /** Why a save failed. Null when it was opening a chat that failed, which no action fixes here. */
    failure: AiChatSaveFailure | null;
    onRetry: () => void;
    /** Leaves the conversation for a new chat, which saves again from its first answer. */
    onStartNew: () => void;
}

const textFor = (reason: string, failure: AiChatSaveFailure | null): string => {
    if (failure === "too-large") {
        return "**Not saved.** This chat is too large to store. You can keep going here, or start a new chat to save from now on.";
    }
    if (failure === "unreachable") {
        return "**Not saved.** Webiny couldn't reach the server, so this chat isn't in AI chats yet. The conversation is still here.";
    }
    if (failure === "rejected") {
        return `**Not saved.** ${reason} The conversation is still here.`;
    }
    return `**Couldn't open this chat.** ${reason}`;
};

/**
 * Says a chat could not be saved, and offers the one thing that fixes it. A warning, not an error:
 * the conversation stays on screen, and nothing the person typed is lost.
 *
 * Retrying cannot shrink a chat that is too large, so that one offers a new chat instead.
 */
export const NotSavedAlert = ({ reason, failure, onRetry, onStartNew }: NotSavedAlertProps) => {
    let action: React.ReactElement | undefined;
    if (failure === "too-large") {
        action = <Alert.Action text="Start a new chat" onClick={onStartNew} />;
    } else if (failure) {
        action = <Alert.Action text="Retry" onClick={onRetry} />;
    }

    return (
        <Alert type="warning" variant="subtle" className="py-sm text-sm" actions={action}>
            {textFor(reason, failure)}
        </Alert>
    );
};
