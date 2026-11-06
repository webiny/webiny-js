import React from "react";
import { cn } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import type { AiChatsPanelPresenter } from "@webiny/app-admin";
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

/** One saved chat: its title and when it was last saved, with a delete button on hover or focus. */
export const ChatRow = ({ chat, day, onSelect, onDelete }: ChatRowProps) => (
    <div
        className={cn(
            "group flex items-center gap-sm rounded-lg pr-sm transition-colors duration-120",
            chat.active ? "bg-neutral-light" : "hover:bg-neutral-dimmed"
        )}
    >
        <button
            type="button"
            onClick={onSelect}
            aria-current={chat.active}
            className="flex min-w-0 flex-1 cursor-pointer flex-col gap-xxs self-stretch rounded-lg px-md py-sm-extra text-left focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
        >
            <span className="truncate text-md font-semibold text-neutral-primary">
                {chat.title}
            </span>
            <span className="truncate text-sm text-neutral-muted">
                {savedLabel(chat.savedOn, day)}
            </span>
        </button>
        {/* Focus on the row shows the button too, so the keyboard can reach it. */}
        <div className="invisible shrink-0 group-focus-within:visible group-hover:visible">
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
