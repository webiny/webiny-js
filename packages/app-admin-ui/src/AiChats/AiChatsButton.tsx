import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { AiChatsPanelFeature } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as ForumIcon } from "@webiny/icons/forum.svg";

/** Opens the AI chats panel from the header, for a chat started earlier or a new one. */
export const AiChatsButton = () => {
    const { presenter } = useFeature(AiChatsPanelFeature);
    const aiEnabled = useFeatureFlags().isEnabled("aiPowerups.adminAssistant");

    if (!aiEnabled) {
        return null;
    }

    return (
        <Tooltip
            side="bottom"
            content="AI chats"
            trigger={
                <IconButton
                    variant="ghost"
                    size="md"
                    icon={<ForumIcon />}
                    aria-label="AI chats"
                    onClick={() => presenter.open()}
                />
            }
        />
    );
};
