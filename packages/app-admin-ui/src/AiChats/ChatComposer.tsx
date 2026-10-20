import React, { useState } from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as SendIcon } from "@webiny/icons/send.svg";

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
            {/* The button sits inside the box, over its bottom-right corner, as in the design. */}
            <div className="relative rounded-md bg-neutral-light py-md pl-md-extra pr-md">
                <textarea
                    autoFocus
                    rows={4}
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    spellCheck={false}
                    className="block max-h-[200px] min-h-0 w-full resize-none border-0 bg-transparent pr-xl text-md text-neutral-primary outline-none placeholder:text-neutral-strong"
                />
                <button
                    type="button"
                    onClick={ask}
                    disabled={!canAsk}
                    className="absolute bottom-md right-md grid cursor-pointer place-items-center size-xl rounded-md bg-primary transition-colors duration-150 hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed disabled:cursor-default disabled:opacity-60"
                >
                    <Icon icon={<SendIcon />} size="md" label="Send" color="neutral-base" />
                </button>
            </div>
        </div>
    );
};
