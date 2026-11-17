import React, { useEffect, useRef } from "react";
import { AiChatsPanelFeature, AiChatsPanelRenderer } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { usePanel } from "@webiny/app-website-builder/BaseEditor/config/index.js";

export const ASSISTANT_PANEL = "aiAssistant";

/**
 * The AI chats panel as an editor panel. The rail opens and closes it, and the panel's own close
 * button closes the rail tab with it, so the two never disagree.
 */
const AssistantPanelBase = () => {
    const { presenter } = useFeature(AiChatsPanelFeature);
    const panel = usePanel(ASSISTANT_PANEL);
    const isOpen = presenter.vm.isOpen;
    const wasOpen = useRef(false);

    useEffect(() => {
        presenter.open();
        return () => presenter.close();
    }, []);

    useEffect(() => {
        if (wasOpen.current && !isOpen) {
            panel.close();
        }
        wasOpen.current = isOpen;
    }, [isOpen]);

    return (
        <div data-affects-preview={"width"} className={"relative h-full flex-none"}>
            <AiChatsPanelRenderer className={"h-full"} width={400} />
        </div>
    );
};

export const AssistantPanel = createReactiveComponent(AssistantPanelBase);
