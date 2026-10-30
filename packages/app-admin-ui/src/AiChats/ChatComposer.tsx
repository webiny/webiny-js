import React, { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";

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
        <div className="flex flex-none flex-col gap-sm-plus border-t border-neutral-dimmed-darker p-md">
            <div className="flex flex-col gap-xs rounded-lg border border-neutral-dimmed-darker p-xs focus-within:border-neutral-strong">
                {/* Grows with the draft up to a limit, then scrolls. */}
                <textarea
                    autoFocus
                    rows={1}
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    spellCheck={false}
                    className="block max-h-[200px] min-h-0 w-full resize-none border-0 bg-transparent px-sm-extra py-sm-plus text-md text-neutral-primary outline-none [field-sizing:content] placeholder:text-neutral-strong"
                />
                <div className="flex items-center justify-end px-xs-plus pb-xs-plus">
                    <Button
                        variant="primary"
                        size="sm"
                        text="Send ↑"
                        disabled={!canAsk}
                        onClick={ask}
                    />
                </div>
            </div>
            <div className="flex items-start justify-between">
                <Text size="sm" className="text-neutral-strong">
                    ↵ to send · Shift + ↵ for a new line
                </Text>
                <Text size="sm" className="text-neutral-muted">
                    Webiny AI
                </Text>
            </div>
        </div>
    );
};
