import React from "react";
import { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { TextareaPrimitive } from "@webiny/admin-ui";
import { ReactComponent as AttachIcon } from "@webiny/icons/attach_file.svg";
import { ReactComponent as SendIcon } from "@webiny/icons/arrow_upward.svg";

export interface ChatComposerProps {
    placeholder: string;
    busy: boolean;
    /** What is answering, e.g. "Webiny AI · claude-sonnet-4-5". */
    assistantLabel: string;
    onAsk: (question: string) => void;
}

/**
 * Where the next question is typed. Enter asks, Shift+Enter starts a new line.
 *
 * The draft is the one piece of state here, and it is purely the input's: nothing else reads it
 * until it is asked.
 */
export const ChatComposer = ({ placeholder, busy, assistantLabel, onAsk }: ChatComposerProps) => {
    const [draft, setDraft] = useState("");
    const canAsk = !busy && draft.trim().length > 0;

    const ask = () => {
        if (!canAsk) {
            return;
        }
        onAsk(draft);
        setDraft("");
    };

    /*
     * Enter while an input method is composing (Japanese, Chinese, Korean) confirms the candidate
     * characters, so it must not send a half-written question.
     */
    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            ask();
        }
    };

    return (
        <>
            <TextareaPrimitive
                autoFocus
                rows={2}
                size="md"
                aria-label={placeholder}
                value={draft}
                forwardEventOnChange
                onChange={event => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                spellCheck={false}
                className="resize-none"
            />
            <div className="flex items-center gap-sm">
                {/* The assistant answers about the project it is opened in. */}
                <Tag variant="neutral-light" icon={<AttachIcon />} content="Current project" />
                <span className="flex-1" />
                <Button
                    variant="primary"
                    size="sm"
                    text="Send"
                    icon={<SendIcon />}
                    iconPosition="end"
                    disabled={!canAsk}
                    onClick={ask}
                />
            </div>
            <div className="flex text-sm text-neutral-strong">
                <span className="flex-1">↵ to send · Shift + ↵ for a new line</span>
                <span>{assistantLabel}</span>
            </div>
        </>
    );
};
