import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as ForumIcon } from "@webiny/icons/forum.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { HintIcon } from "./HintIcon.js";
import { Kbd } from "./Kbd.js";

/** The palette suggests moving to the chats panel once a conversation has this many turns. */
export const CONTINUE_IN_CHATS_AFTER = 3;

/**
 * Offered once a quick ask has turned into a conversation. The palette is built for a question or
 * two; a longer exchange is easier to follow in the chats panel, which has the room and keeps the
 * history.
 */
export const ContinueInChats = ({ onContinue }: { onContinue: () => void }) => (
    <div className="mx-sm mb-md flex items-center gap-sm rounded-lg bg-neutral-light px-sm-extra py-sm">
        <Icon icon={<ForumIcon />} size="sm" label="" color="neutral-strong" />
        <Text size="md" className="min-w-0 flex-1 text-neutral-strong">
            Turning into a longer conversation?
        </Text>
        <button
            type="button"
            onClick={onContinue}
            className="inline-flex shrink-0 cursor-pointer items-center gap-sm rounded-md border border-neutral-muted bg-neutral-base px-sm py-xs transition-colors duration-150 hover:bg-neutral-subtle focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed active:translate-y-px"
        >
            <Text size="sm" className="font-semibold text-neutral-primary">
                Continue in AI chats
            </Text>
            <Kbd>
                ⌘
                <HintIcon element={<ReturnIcon />} />
            </Kbd>
        </button>
    </div>
);
