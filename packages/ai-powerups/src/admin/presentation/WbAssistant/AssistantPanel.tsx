import React, { useEffect } from "react";
import { useFeature, useRoute } from "@webiny/app";
import { AiChatsPanelRenderer } from "@webiny/app-admin";
import { Editor } from "@webiny/app-website-builder";
import { ReactComponent as CollapseIcon } from "@webiny/icons/left_panel_open.svg";
import { PageEditorAssistantFeature } from "./feature.js";

export const ASSISTANT_PANEL = "aiAssistant";

const WIDTH = 400;

/**
 * Set on the editor link the API's `createPage` tool returns (`?assistant=build`), so the editor
 * knows it was opened from the chat that created the page.
 */
const BUILD_PARAM = "assistant";
const BUILD_VALUE = "build";

/**
 * The AI chats panel as an editor panel. The editor decides when it shows; the panel's own close
 * button collapses it, so it shows the collapse icon the editor's other panels use.
 */
export const AssistantPanel = () => {
    const panel = Editor.usePanel(ASSISTANT_PANEL);
    const { presenter } = useFeature(PageEditorAssistantFeature);
    const { route, replaceRouteParams } = useRoute();

    /*
     * Opened from the assistant's link to a page it just created: show the chat and have it build
     * the page. Here, not with the editor's other assistant wiring, because only the panel's own
     * content can open the panel; it stays mounted while collapsed. The marker goes first, so a
     * reload doesn't ask a second time.
     */
    const fromAssistant = route?.params?.[BUILD_PARAM] === BUILD_VALUE;
    useEffect(() => {
        if (!fromAssistant) {
            return;
        }
        replaceRouteParams((params: Record<string, unknown>) => {
            const rest = { ...params };
            delete rest[BUILD_PARAM];
            return rest;
        });
        panel.open();
        presenter.continueBuild();
    }, [fromAssistant]);

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
