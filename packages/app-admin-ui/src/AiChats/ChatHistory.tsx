import React from "react";
import { Button } from "@webiny/admin-ui";
import { Kbd } from "@webiny/admin-ui";
import { SidePanelBody } from "@webiny/admin-ui";
import { SidePanelFooter } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiChatsPanelPresenter } from "@webiny/app-admin";
import { ChatHistoryEmpty } from "./ChatHistoryEmpty.js";
import { ChatRow } from "./ChatRow.js";

export interface ChatHistoryProps {
    vm: AiChatsPanelPresenter.ViewModel;
    newChatDisabled: boolean;
    onNewChat: () => void;
    /** Asks a starter question in a new chat. */
    onAskStarter: (question: string) => void;
    onSelect: (chatId: string) => void;
    onDelete: (chatId: string) => void;
    onLoadMore: () => void;
}

const ChatListPlaceholder = () => (
    <div className="flex flex-col gap-md p-sm">
        <Skeleton type="text" size="xs" className="w-[80%]" />
        <Skeleton type="text" size="xs" className="w-[60%]" />
        <Skeleton type="text" size="xs" className="w-[70%]" />
    </div>
);

const Message = ({ children, error }: { children: React.ReactNode; error?: boolean }) => (
    <Text
        as="div"
        size="sm"
        className={error ? "p-sm text-destructive-primary" : "p-sm text-neutral-strong"}
    >
        {children}
    </Text>
);

/** The saved chats, by the day they were last saved, then the panel's keys. */
export const ChatHistory = ({
    vm,
    newChatDisabled,
    onNewChat,
    onAskStarter,
    onSelect,
    onDelete,
    onLoadMore
}: ChatHistoryProps) => {
    const noChats = vm.chats.length === 0;
    const empty = noChats && !vm.loading && !vm.error;

    return (
        <>
            {empty ? (
                <SidePanelBody className="flex-1 justify-center py-xxl">
                    <ChatHistoryEmpty
                        newChatDisabled={newChatDisabled}
                        onNewChat={onNewChat}
                        onAskStarter={onAskStarter}
                    />
                </SidePanelBody>
            ) : (
                <SidePanelBody className="gap-sm">
                    {noChats && vm.loading ? <ChatListPlaceholder /> : null}
                    {!noChats && vm.groups.length === 0 ? (
                        <Message>No chat title matches “{vm.search.trim()}”.</Message>
                    ) : null}
                    {vm.error ? <Message error>{vm.error}</Message> : null}

                    {vm.groups.map(group => (
                        <div key={group.day} className="flex flex-col gap-xxs">
                            <div className="px-sm pb-xs pt-sm text-sm font-semibold uppercase text-neutral-strong">
                                {group.label}
                            </div>
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

                    {vm.hasMore ? (
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                text={vm.loading ? "Loading…" : "Show older chats"}
                                disabled={vm.loading}
                                onClick={onLoadMore}
                            />
                        </div>
                    ) : null}
                </SidePanelBody>
            )}

            <SidePanelFooter variant="light">
                <div className="flex items-center gap-xs">
                    <Kbd keys={["⌘", "J"]} />
                    <span className="flex-1">toggle AI chats</span>
                    <Kbd keys={["esc"]} />
                    <span>to close</span>
                </div>
            </SidePanelFooter>
        </>
    );
};
