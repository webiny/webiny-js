import React, { useState } from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

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
        <div className="flex-none px-lg pb-lg">
            <div className="flex flex-col gap-xs rounded-lg bg-neutral-light px-md-plus pb-sm pt-md">
                <textarea
                    autoFocus
                    rows={2}
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    spellCheck={false}
                    className="max-h-[200px] min-h-0 w-full resize-none border-0 bg-transparent text-md text-neutral-primary outline-none placeholder:text-neutral-muted"
                />
                <button
                    type="button"
                    onClick={ask}
                    disabled={!canAsk}
                    className="grid size-xl shrink-0 cursor-pointer place-items-center self-end rounded-md bg-primary transition-colors duration-150 hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed disabled:cursor-default disabled:opacity-60"
                >
                    <Icon icon={<AddIcon />} size="md" label="Ask" color="neutral-base" />
                </button>
            </div>
        </div>
    );
};
