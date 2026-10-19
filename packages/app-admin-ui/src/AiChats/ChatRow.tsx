import React from "react";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { TimeAgo } from "@webiny/admin-ui";
import type { AiChatsPanelPresenter } from "@webiny/app-admin";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";

export interface ChatRowProps {
    chat: AiChatsPanelPresenter.Row;
    onSelect: () => void;
    onDelete: () => void;
}

/** One saved chat: its title and when it was last saved, with a delete button on hover. */
export const ChatRow = ({ chat, onSelect, onDelete }: ChatRowProps) => (
    <div
        className={cn(
            "group flex items-center gap-xs rounded-md pr-xs transition-colors duration-150",
            chat.active ? "bg-neutral-dimmed" : "hover:bg-neutral-light"
        )}
    >
        <button
            type="button"
            onClick={onSelect}
            aria-current={chat.active}
            className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-xxs rounded-md px-sm py-xs-plus text-left focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
        >
            <Text size="md" className="w-full truncate font-semibold text-neutral-primary">
                {chat.title}
            </Text>
            <Text size="sm" className="text-neutral-muted">
                <TimeAgo datetime={chat.savedOn} />
            </Text>
        </button>
        <button
            type="button"
            onClick={onDelete}
            className="grid size-lg shrink-0 cursor-pointer place-items-center rounded-md opacity-0 transition-opacity duration-150 hover:bg-neutral-dimmed focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed group-hover:opacity-100"
        >
            <Icon icon={<DeleteIcon />} size="sm" label="Delete chat" color="neutral-light" />
        </button>
    </div>
);
