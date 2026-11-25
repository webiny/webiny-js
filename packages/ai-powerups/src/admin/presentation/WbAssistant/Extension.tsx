import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { AssistantPanel } from "./AssistantPanel.js";
import { ASSISTANT_PANEL } from "./AssistantPanel.js";
import { PageEditorAssistant } from "./PageEditorAssistant.js";
import { PageEditorAssistantFeature } from "./feature.js";
import { PromptContextFeature } from "./promptContextFeature.js";

const { Ui } = PageEditorConfig;

/**
 * The admin assistant in the page editor: a panel beside the canvas, and tools that let it build and
 * change the page open in the editor.
 */
export const WbAssistant = () => {
    const featureFlags = useFeatureFlags();

    /*
     * Building pages is AI page generation, licensed on its own. Without it the editor has no
     * assistant panel and offers no page tools; the assistant stays in the command palette.
     */
    const assistant = featureFlags.isEnabled("aiPowerups.adminAssistant");
    const pageGeneration = featureFlags.isEnabled("aiPowerups.websiteBuilder.pageGeneration");
    if (!assistant || !pageGeneration) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={PageEditorAssistantFeature} />
            <RegisterFeature feature={PromptContextFeature} />
            <PageEditorConfig>
                <Ui.Panels.Panel
                    name={ASSISTANT_PANEL}
                    label={"AI assistant"}
                    element={<AssistantPanel />}
                />
                <Ui.Element
                    name={"aiAssistantTools"}
                    group={"overlays"}
                    element={<PageEditorAssistant />}
                />
            </PageEditorConfig>
        </>
    );
};
