import React from "react";
import { Button } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { SidePanel } from "@webiny/admin-ui";
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
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { useAiSettingsLocation } from "~/CommandPalette/useAiSettingsLocation.js";
import { ChatConversation } from "./ChatConversation.js";
import { ChatHistory } from "./ChatHistory.js";

/**
 * The AI chats side panel: the saved chats, and the conversation the assistant holds.
 *
 * Docked beside the page rather than over it, so the admin stays usable: an answer that names a page
 * can be checked without closing the chat.
 */
const AiChatsPanelBase = () => {
    const { presenter } = useFeature(AiChatsPanelFeature);
    const { presenter: assistant } = useFeature(AdminAssistantFeature);
    const { identity } = useIdentity();
    const settings = useAiSettingsLocation();
    const aiEnabled = useFeatureFlags().isEnabled("aiPowerups.adminAssistant");
    const { vm } = presenter;

    if (!aiEnabled || !vm.isOpen) {
        return null;
    }

    const firstName = identity?.profile?.firstName ?? "";
    const openChatId = assistant.vm.chatId;
    const busy = assistant.vm.busy;
    const close = () => presenter.close();
    const startNew = () => presenter.startNew();

    if (vm.view === "history") {
        // No search until there is something to search.
        const hasChats = vm.chats.length > 0;

        return (
            <SidePanel
                title="AI chats"
                icon={<Icon icon={<AiIcon />} size="md" label="" color="accent" />}
                headerEnd={
                    hasChats ? (
                        <Button
                            variant="tertiary"
                            size="sm"
                            icon={<AddIcon />}
                            text="New chat"
                            disabled={busy}
                            onClick={startNew}
                        />
                    ) : null
                }
                onClose={close}
                closeLabel="Close AI chats"
                headerExtra={
                    hasChats ? (
                        <Input
                            variant="secondary"
                            size="md"
                            placeholder="Search chats…"
                            value={vm.search}
                            onChange={search => presenter.setSearch(search)}
                            startIcon={<Icon label="Search" icon={<SearchIcon />} />}
                        />
                    ) : null
                }
                className="h-main-content"
            >
                <ChatHistory
                    vm={vm}
                    newChatDisabled={busy}
                    onNewChat={startNew}
                    onAskStarter={question => {
                        startNew();
                        assistant.ask(question);
                    }}
                    onSelect={chatId => presenter.select(chatId)}
                    onDelete={chatId => presenter.remove(chatId)}
                    onLoadMore={() => presenter.loadMore()}
                />
            </SidePanel>
        );
    }

    const openChat = vm.chats.find(chat => chat.id === openChatId);

    // The panel stays open beside the settings page, so "Try again" is one click away.
    let chooseModel: (() => void) | undefined;
    if (settings?.canOpen()) {
        chooseModel = () => settings.open();
    }

    return (
        <SidePanel
            title={vm.conversationTitle}
            onBack={() => presenter.showHistory()}
            backLabel="Back to AI chats"
            headerEnd={
                <>
                    <IconButton
                        variant="ghost"
                        size="md"
                        icon={<AddIcon />}
                        aria-label="New chat"
                        disabled={busy}
                        onClick={startNew}
                    />
                    {/* The only option so far is deleting the open chat, so there is no menu without one. */}
                    {openChatId ? (
                        <DropdownMenu
                            trigger={
                                <IconButton
                                    variant="ghost"
                                    size="md"
                                    icon={<MoreIcon />}
                                    aria-label="Chat options"
                                />
                            }
                        >
                            <DropdownMenu.Item
                                text="Delete chat"
                                icon={<DeleteIcon />}
                                onClick={() => presenter.remove(openChatId)}
                            />
                        </DropdownMenu>
                    ) : null}
                </>
            }
            onClose={close}
            closeLabel="Close AI chats"
            className="h-main-content"
        >
            <ChatConversation
                assistant={assistant}
                firstName={firstName}
                startedOn={openChat?.createdOn}
                onStartNew={startNew}
                onChooseModel={chooseModel}
            />
        </SidePanel>
    );
};

export const AiChatsPanel = createReactiveComponent(AiChatsPanelBase);
