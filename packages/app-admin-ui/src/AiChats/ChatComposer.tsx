import React, { useState } from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as SendIcon } from "@webiny/icons/arrow_upward.svg";

export interface ChatComposerProps {
    placeholder: string;
    busy: boolean;
    onAsk: (question: string) => void;
}

/**
 * Where the next question is typed. Enter asks, Shift+Enter starts a new line.
 *
 * The draft is the one piece of state here, and it is purely the input's: nothing else reads it
 * until it is asked.
 */
export const ChatComposer = ({ placeholder, busy, onAsk }: ChatComposerProps) => {
    const [draft, setDraft] = useState("");
    const canAsk = !busy && draft.trim().length > 0;

    const ask = () => {
        if (!canAsk) {
            return;
        }
        onAsk(draft);
        setDraft("");
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            ask();
        }
    };

    return (
        <div className="flex flex-none items-end gap-sm border-t border-neutral-subtle px-md py-sm-plus">
            <textarea
                autoFocus
                rows={2}
                value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                spellCheck={false}
                className="max-h-[200px] min-h-0 flex-1 resize-none border-0 bg-transparent text-md text-neutral-primary outline-none"
            />
            <button
                type="button"
                onClick={ask}
                disabled={!canAsk}
                className="grid size-xl shrink-0 cursor-pointer place-items-center rounded-md bg-primary-strong transition-colors hover:bg-primary-xstrong duration-150 focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed disabled:cursor-default disabled:opacity-40"
            >
                <Icon icon={<SendIcon />} size="sm" label="Ask" color="neutral-base" />
            </button>
        </div>
    );
};
