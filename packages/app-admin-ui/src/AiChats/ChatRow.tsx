import React from "react";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiChatsPanelPresenter } from "@webiny/app-admin";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";

export interface ChatRowProps {
    chat: AiChatsPanelPresenter.Row;
    day: AiChatsPanelPresenter.Day;
    onSelect: () => void;
    onDelete: () => void;
}

/** The time for chats saved today or yesterday, since the group already names the day; a date before that. */
const savedLabel = (savedOn: string, day: AiChatsPanelPresenter.Day): string => {
    const date = new Date(savedOn);
    if (day === "earlier") {
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

/** One saved chat: its title and when it was last saved, which a delete button replaces on hover. */
export const ChatRow = ({ chat, day, onSelect, onDelete }: ChatRowProps) => (
    <div
        className={cn(
            "group flex min-h-xxl items-center gap-sm rounded-lg pr-sm-extra transition-colors duration-150",
            chat.active ? "bg-neutral-light" : "hover:bg-neutral-light"
        )}
    >
        <button
            type="button"
            onClick={onSelect}
            aria-current={chat.active}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-sm self-stretch rounded-lg py-sm pl-sm-plus text-left focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
        >
            <Icon icon={<AiIcon />} size="md" label="" color="neutral-strong" />
            <Text size="md" className="min-w-0 flex-1 truncate text-neutral-primary">
                {chat.title}
            </Text>
        </button>
        {/* Focus on the row shows the button too, so the keyboard can reach it. */}
        <Text
            size="sm"
            className="shrink-0 text-neutral-strong group-focus-within:hidden group-hover:hidden"
        >
            {savedLabel(chat.savedOn, day)}
        </Text>
        <div className="hidden shrink-0 group-focus-within:block group-hover:block">
            <IconButton
                variant="ghost"
                size="sm"
                icon={<DeleteIcon />}
                aria-label="Delete chat"
                onClick={onDelete}
            />
        </div>
    </div>
);
