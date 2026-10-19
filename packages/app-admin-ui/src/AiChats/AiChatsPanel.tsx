import React from "react";
import { Button } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { AdminAssistantFeature } from "@webiny/app-admin";
import { AiChatsPanelFeature } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as ForumIcon } from "@webiny/icons/forum.svg";
import { useInitials } from "~/CommandPalette/useInitials.js";
import { ChatConversation } from "./ChatConversation.js";
import { ChatList } from "./ChatList.js";

/**
 * The AI chats side panel: saved chats on the left, the open conversation on the right.
 *
 * Not modal, so the admin stays usable beside it: an answer that names a page can be checked
 * without closing the chat.
 */
const AiChatsPanelBase = () => {
    const { presenter } = useFeature(AiChatsPanelFeature);
    const { presenter: assistant } = useFeature(AdminAssistantFeature);
    const initials = useInitials();
    const aiEnabled = useFeatureFlags().isEnabled("aiPowerups.adminAssistant");
    const { vm } = presenter;

    if (!aiEnabled) {
        return null;
    }

    return (
        <Drawer
            open={vm.isOpen}
            onClose={() => presenter.close()}
            title="AI chats"
            icon={<ForumIcon />}
            size="xl"
            bodyPadding={false}
            headerSeparator={true}
            headerActions={
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<AddIcon />}
                    text="New chat"
                    disabled={assistant.vm.busy}
                    onClick={() => presenter.startNew()}
                />
            }
        >
            <div className="flex h-full min-h-0">
                <div className="flex w-[280px] flex-none flex-col border-r border-neutral-subtle">
                    <ChatList
                        vm={vm}
                        onSelect={chatId => presenter.select(chatId)}
                        onDelete={chatId => presenter.remove(chatId)}
                        onLoadMore={() => presenter.loadMore()}
                    />
                </div>
                <ChatConversation assistant={assistant} initials={initials} />
            </div>
        </Drawer>
    );
};

export const AiChatsPanel = createReactiveComponent(AiChatsPanelBase);
