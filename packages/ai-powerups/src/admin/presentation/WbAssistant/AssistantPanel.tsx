import React from "react";
import { AiChatsPanelRenderer } from "@webiny/app-admin";
import { Editor } from "@webiny/app-website-builder";
import { ReactComponent as CollapseIcon } from "@webiny/icons/left_panel_open.svg";

export const ASSISTANT_PANEL = "aiAssistant";

/**
 * The AI chats panel as an editor panel. The editor decides when it shows; the panel's own close
 * button collapses it, so it shows the collapse icon the editor's other panels use.
 */
export const AssistantPanel = () => {
    const panel = Editor.usePanel(ASSISTANT_PANEL);

    return (
        <div data-affects-preview={"width"} className={"relative h-full flex-none"}>
            <AiChatsPanelRenderer
                className={"h-full"}
                width={400}
                onClose={panel.close}
                closeLabel={"Collapse AI assistant"}
                closeIcon={<CollapseIcon />}
            />
        </div>
    );
};
