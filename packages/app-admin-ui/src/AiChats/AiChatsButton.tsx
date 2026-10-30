import React from "react";
import { Button } from "@webiny/admin-ui";
import { AiChatsPanelFeature } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";

/**
 * Opens the AI assistant panel on the conversation, from the header, or closes it. Labelled, as in
 * the design: the assistant is the one primary action in the header. The saved chats stay one click
 * away inside the panel, and on mod+j.
 */
const AiChatsButtonBase = () => {
    const { presenter } = useFeature(AiChatsPanelFeature);
    const aiEnabled = useFeatureFlags().isEnabled("aiPowerups.adminAssistant");

    if (!aiEnabled) {
        return null;
    }

    return (
        <Button
            variant="primary"
            size="sm"
            icon={<AiIcon />}
            text="AI assistant"
            onClick={() => (presenter.vm.isOpen ? presenter.close() : presenter.open())}
        />
    );
};

export const AiChatsButton = createReactiveComponent(AiChatsButtonBase);
