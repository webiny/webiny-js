import React from "react";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { ScrollArea } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiChatsPanelPresenter } from "@webiny/app-admin";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { HintItem } from "~/CommandPalette/components/index.js";
import { ChatRow } from "./ChatRow.js";

export interface ChatHistoryProps {
    vm: AiChatsPanelPresenter.ViewModel;
    newChatDisabled: boolean;
    onSearch: (search: string) => void;
    onNewChat: () => void;
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

const Message = ({ children, error }: { children: React.ReactNode; error?: boolean }) => (
    <Text
        as="div"
        size="sm"
        className={
            error ? "px-sm py-sm text-destructive-primary" : "px-sm py-sm text-neutral-strong"
        }
    >
        {children}
    </Text>
);

/** The saved chats, by the day they were last saved, with search and a new chat on top. */
export const ChatHistory = ({
    vm,
    newChatDisabled,
    onSearch,
    onNewChat,
    onSelect,
    onDelete,
    onLoadMore
}: ChatHistoryProps) => {
    const noChats = vm.chats.length === 0;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-none flex-col gap-md p-lg">
                <Input
                    variant="secondary"
                    size="md"
                    placeholder="Search chats…"
                    value={vm.search}
                    onChange={onSearch}
                    startIcon={<Icon label="Search" icon={<SearchIcon />} />}
                />
                <Button
                    variant="primary"
                    size="md"
                    icon={<AddIcon />}
                    text="New chat"
                    className="w-full"
                    disabled={newChatDisabled}
                    onClick={onNewChat}
                />
            </div>

            {/*
             * The scroll area lays its content out as a table that grows to fit, so a long title would
             * never truncate. Making that wrapper a block gives the rows the panel's width.
             */}
            <ScrollArea className="min-h-0 flex-1" viewportClassName="px-md pb-md [&>div]:!block">
                {noChats && vm.loading ? <ChatListPlaceholder /> : null}
                {noChats && !vm.loading && !vm.error ? (
                    <Message>
                        No saved chats yet. Every conversation with the assistant is saved here.
                    </Message>
                ) : null}
                {!noChats && vm.groups.length === 0 ? (
                    <Message>No chat title matches “{vm.search.trim()}”.</Message>
                ) : null}
                {vm.error ? <Message error>{vm.error}</Message> : null}

                <div className="flex flex-col gap-lg">
                    {vm.groups.map(group => (
                        <div key={group.day} className="flex flex-col gap-xs-plus">
                            <Text as="div" size="sm" className="text-neutral-strong">
                                {group.label}
                            </Text>
                            {group.chats.map(chat => (
                                <ChatRow
                                    key={chat.id}
                                    chat={chat}
                                    day={group.day}
                                    onSelect={() => onSelect(chat.id)}
                                    onDelete={() => onDelete(chat.id)}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {vm.hasMore ? (
                    <div className="pt-sm">
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

            <div className="flex flex-none items-center justify-between border-t border-neutral-dimmed-darker bg-neutral-light px-lg py-md">
                <HintItem hint={{ keys: ["⌘ J"], label: "AI chats" }} />
                <HintItem hint={{ keys: ["esc"], label: "to close" }} />
            </div>
        </div>
    );
};
