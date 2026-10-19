import React from "react";
import { Button } from "@webiny/admin-ui";
import { AiChatsPanelFeature } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";

/** Opens the AI assistant panel from the header. */
export const AiChatsButton = () => {
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
            onClick={() => presenter.open()}
        />
    );
};
