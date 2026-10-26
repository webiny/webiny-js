import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { AiChatsPanelFeature } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";

/** Opens the AI chats panel on the saved chats, from the header. */
export const AiChatsButton = () => {
    const { presenter } = useFeature(AiChatsPanelFeature);
    const aiEnabled = useFeatureFlags().isEnabled("aiPowerups.adminAssistant");

    if (!aiEnabled) {
        return null;
    }

    return (
        <Tooltip
            side="bottom"
            content="AI chats (⌘J)"
            trigger={
                <IconButton
                    variant="secondary"
                    size="sm"
                    icon={<AiIcon />}
                    aria-label="AI chats"
                    onClick={() => presenter.toggleHistory()}
                />
            }
        />
    );
};
