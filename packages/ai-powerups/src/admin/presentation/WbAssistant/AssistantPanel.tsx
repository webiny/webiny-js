import React from "react";
import { AiChatsPanelRenderer } from "@webiny/app-admin";
import { Editor } from "@webiny/app-website-builder";
import { ReactComponent as CollapseIcon } from "@webiny/icons/left_panel_open.svg";

export const ASSISTANT_PANEL = "aiAssistant";

const WIDTH = 400;

/**
 * The AI chats panel as an editor panel. The editor decides when it shows; the panel's own close
 * button collapses it, so it shows the collapse icon the editor's other panels use.
 */
export const AssistantPanel = () => {
    const panel = Editor.usePanel(ASSISTANT_PANEL);

    /*
     * Sized here, not only by the panel: below 1024px `SidePanel` positions itself absolutely, and
     * this host would otherwise measure 0, leaving the editor's panel slot empty.
     */
    return (
        <div
            data-affects-preview={"width"}
            className={"relative h-full flex-none"}
            style={{ width: WIDTH }}
        >
            <AiChatsPanelRenderer
                className={"h-full"}
                width={WIDTH}
                onClose={panel.close}
                closeLabel={"Collapse AI assistant"}
                closeIcon={<CollapseIcon />}
            />
        </div>
    );
};
