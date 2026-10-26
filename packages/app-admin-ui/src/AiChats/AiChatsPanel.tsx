import React from "react";
import { Button } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { AdminAssistantFeature } from "@webiny/app-admin";
import { AiChatsPanelFeature } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useIdentity } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as MoreIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ChatConversation } from "./ChatConversation.js";
import { ChatHistory } from "./ChatHistory.js";

/**
 * The AI chats side panel: the saved chats, and the conversation the assistant holds.
 *
 * Not modal, so the admin stays usable beside it: an answer that names a page can be checked
 * without closing the chat.
 */
const AiChatsPanelBase = () => {
    const { presenter } = useFeature(AiChatsPanelFeature);
    const { presenter: assistant } = useFeature(AdminAssistantFeature);
    const { identity } = useIdentity();
    const aiEnabled = useFeatureFlags().isEnabled("aiPowerups.adminAssistant");
    const { vm } = presenter;

    if (!aiEnabled) {
        return null;
    }

    const showingHistory = vm.view === "history";
    const firstName = identity?.profile?.firstName ?? "";
    const openChatId = assistant.vm.chatId;

    return (
        <Drawer
            open={vm.isOpen}
            onClose={() => presenter.close()}
            icon={<Icon icon={<AiIcon />} size="md" label="" color="accent" />}
            title={
                <Text as="span" size="md" className="truncate font-semibold">
                    {showingHistory ? "AI chats" : vm.conversationTitle}
                </Text>
            }
            width={464}
            // The design's Shadow-xl, which is not the admin-ui `shadow-xl` token.
            className="shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]"
            headerSeparator={true}
            bodyPadding={false}
            headerActions={
                // The only action so far is deleting the open chat, so there is no menu without one.
                !showingHistory && openChatId ? (
                    <DropdownMenu
                        trigger={
                            <IconButton
                                variant="ghost"
                                size="md"
                                icon={<MoreIcon />}
                                aria-label="Chat actions"
                            />
                        }
                    >
                        <DropdownMenu.Item
                            text="Delete chat"
                            icon={<DeleteIcon />}
                            onClick={() => presenter.remove(openChatId)}
                        />
                    </DropdownMenu>
                ) : null
            }
        >
            {showingHistory ? (
                <ChatHistory
                    vm={vm}
                    newChatDisabled={assistant.vm.busy}
                    onSearch={search => presenter.setSearch(search)}
                    onNewChat={() => presenter.startNew()}
                    onSelect={chatId => presenter.select(chatId)}
                    onDelete={chatId => presenter.remove(chatId)}
                    onLoadMore={() => presenter.loadMore()}
                />
            ) : (
                <div className="flex h-full min-h-0 flex-col">
                    <div className="flex flex-none items-center justify-between border-b border-neutral-dimmed-darker px-md py-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            text="← AI chats"
                            onClick={() => presenter.showHistory()}
                        />
                        <Button
                            variant="tertiary"
                            size="sm"
                            icon={<AddIcon />}
                            text="New chat"
                            disabled={assistant.vm.busy}
                            onClick={() => presenter.startNew()}
                        />
                    </div>
                    <ChatConversation assistant={assistant} firstName={firstName} />
                </div>
            )}
        </Drawer>
    );
};

export const AiChatsPanel = createReactiveComponent(AiChatsPanelBase);
