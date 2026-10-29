import React from "react";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as ForumIcon } from "@webiny/icons/forum.svg";
import { Keys } from "./Kbd.js";

/** The palette suggests moving to the chats panel once a conversation has this many turns. */
export const CONTINUE_IN_CHATS_AFTER = 3;

/**
 * Offered once a quick ask has turned into a conversation. The palette is built for a question or
 * two; a longer exchange is easier to follow in the chats panel, which has the room and keeps the
 * history.
 */
export const ContinueInChats = ({ onContinue }: { onContinue: () => void }) => (
    <div className="flex items-center gap-sm rounded-lg bg-neutral-subtle px-md py-sm">
        <Icon icon={<ForumIcon />} size="md" label="" color="neutral-light" />
        <Text size="md" className="min-w-0 flex-1 text-neutral-strong">
            Turning into a longer conversation?
        </Text>
        <Button variant="secondary" size="sm" text="Continue in AI chats" onClick={onContinue} />
        <Keys keys={["⌘↵"]} />
    </div>
);
