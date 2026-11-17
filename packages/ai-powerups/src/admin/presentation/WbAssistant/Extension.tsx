import React from "react";
import { useFeatureFlags } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { AssistantPanel, ASSISTANT_PANEL } from "./AssistantPanel.js";
import { PageEditorAssistant } from "./PageEditorAssistant.js";

const { Ui } = PageEditorConfig;

/**
 * The admin assistant in the page editor: a panel beside the canvas, and tools that let it build and
 * change the page open in the editor.
 */
export const WbAssistant = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("aiPowerups.adminAssistant")) {
        return null;
    }

    return (
        <PageEditorConfig>
            <Ui.Panels.Panel
                name={ASSISTANT_PANEL}
                label={"AI assistant"}
                icon={<AiIcon />}
                element={<AssistantPanel />}
            />
            <Ui.Element
                name={"aiAssistantTools"}
                group={"overlays"}
                element={<PageEditorAssistant />}
            />
        </PageEditorConfig>
    );
};
