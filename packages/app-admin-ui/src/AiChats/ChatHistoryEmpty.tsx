import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as ForumIcon } from "@webiny/icons/forum.svg";
import { FollowUps } from "~/CommandPalette/components/index.js";
import { CHAT_STARTERS } from "./chatStarters.js";

export interface ChatHistoryEmptyProps {
    newChatDisabled: boolean;
    onNewChat: () => void;
    onAskStarter: (question: string) => void;
}

/** No saved chats yet: what chats are, a way to start one, and a few questions to start with. */
export const ChatHistoryEmpty = ({
    newChatDisabled,
    onNewChat,
    onAskStarter
}: ChatHistoryEmptyProps) => (
    <div className="flex flex-col items-center gap-md">
        <EmptyState
            size="sm"
            icon={<ForumIcon />}
            className="py-0"
            title="No chats yet"
            description="Ask about your content or run an action. Chats save automatically and show up here."
            actions={
                <Button
                    variant="tertiary"
                    size="sm"
                    icon={<AddIcon />}
                    text="New chat"
                    disabled={newChatDisabled}
                    onClick={onNewChat}
                />
            }
        />
        <div className="flex flex-col items-center gap-sm">
            <span className="text-sm font-semibold uppercase text-neutral-strong">Try asking</span>
            <div className="flex justify-center">
                <FollowUps
                    questions={CHAT_STARTERS}
                    disabled={newChatDisabled}
                    onAsk={onAskStarter}
                />
            </div>
        </div>
    </div>
);
