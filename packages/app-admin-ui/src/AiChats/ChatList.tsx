import React from "react";
import { Button } from "@webiny/admin-ui";
import { ScrollArea } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiChatsPanelPresenter } from "@webiny/app-admin";
import { ChatRow } from "./ChatRow.js";

export interface ChatListProps {
    vm: AiChatsPanelPresenter.ViewModel;
    onSelect: (chatId: string) => void;
    onDelete: (chatId: string) => void;
    onLoadMore: () => void;
}

const ChatListPlaceholder = () => (
    <div className="flex flex-col gap-md px-sm py-sm">
        <Skeleton type="text" size="xs" className="w-[80%]" />
        <Skeleton type="text" size="xs" className="w-[60%]" />
        <Skeleton type="text" size="xs" className="w-[70%]" />
    </div>
);

/** The saved chats, newest first, read a page at a time. */
export const ChatList = ({ vm, onSelect, onDelete, onLoadMore }: ChatListProps) => {
    const empty = vm.chats.length === 0;

    return (
        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-xs-plus">
            {empty && vm.loading ? <ChatListPlaceholder /> : null}
            {empty && !vm.loading && !vm.error ? (
                <Text as="div" size="sm" className="px-sm py-sm text-neutral-muted">
                    No saved chats yet. Every conversation with the assistant is saved here.
                </Text>
            ) : null}
            {vm.error ? (
                <Text as="div" size="sm" className="px-sm py-sm text-destructive-primary">
                    {vm.error}
                </Text>
            ) : null}
            {/*
             * A fixed width, because the scroll area lays its content out as a table that grows to
             * fit, so a long title would never truncate. The panel's 280px column less the padding.
             */}
            <div className="flex w-[268px] flex-col gap-xxs">
                {vm.chats.map(chat => (
                    <ChatRow
                        key={chat.id}
                        chat={chat}
                        onSelect={() => onSelect(chat.id)}
                        onDelete={() => onDelete(chat.id)}
                    />
                ))}
            </div>
            {vm.hasMore ? (
                <div className="px-sm py-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        text={vm.loading ? "Loading…" : "Show older chats"}
                        disabled={vm.loading}
                        onClick={onLoadMore}
                    />
                </div>
            ) : null}
        </ScrollArea>
    );
};
