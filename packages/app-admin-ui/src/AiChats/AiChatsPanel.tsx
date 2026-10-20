import React from "react";
import { Drawer } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { AdminAssistantFeature } from "@webiny/app-admin";
import { AiChatsPanelFeature } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useIdentity } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ChatConversation } from "./ChatConversation.js";
import { ChatList } from "./ChatList.js";

/**
 * The AI assistant side panel: one conversation, with the saved chats one click away.
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

    const toggleHistory = () => {
        if (showingHistory) {
            presenter.showConversation();
        } else {
            presenter.showHistory();
        }
    };

    return (
        <Drawer
            open={vm.isOpen}
            onClose={() => presenter.close()}
            icon={<Icon icon={<AiIcon />} size="lg" label="" color="accent" />}
            title={showingHistory ? "Saved chats" : "Webiny AI assistant"}
            size="md"
            // Not modal, so no overlay sets it apart from the page. The shadow falls left, onto the page.
            className="shadow-[-12px_0_32px_rgba(0,0,0,0.14)]"
            bodyPadding={false}
            headerActions={
                <>
                    <Tooltip
                        side="bottom"
                        content={showingHistory ? "Back to the chat" : "Saved chats"}
                        trigger={
                            <IconButton
                                variant="ghost"
                                size="md"
                                icon={<HistoryIcon />}
                                aria-label="Saved chats"
                                aria-pressed={showingHistory}
                                onClick={toggleHistory}
                            />
                        }
                    />
                    <Tooltip
                        side="bottom"
                        content="New chat"
                        trigger={
                            <IconButton
                                variant="ghost"
                                size="md"
                                icon={<AddIcon />}
                                aria-label="New chat"
                                disabled={assistant.vm.busy}
                                onClick={() => presenter.startNew()}
                            />
                        }
                    />
                </>
            }
        >
            {showingHistory ? (
                <ChatList
                    vm={vm}
                    onSelect={chatId => presenter.select(chatId)}
                    onDelete={chatId => presenter.remove(chatId)}
                    onLoadMore={() => presenter.loadMore()}
                />
            ) : (
                <ChatConversation assistant={assistant} firstName={firstName} />
            )}
        </Drawer>
    );
};

export const AiChatsPanel = createReactiveComponent(AiChatsPanelBase);
