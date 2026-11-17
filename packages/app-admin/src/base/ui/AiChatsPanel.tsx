import type React from "react";
import { createVoidComponent } from "@webiny/app";
import { makeDecoratable } from "@webiny/app";

export interface AiChatsPanelProps {
    /** Sizes the panel's height to its host. The admin frame uses `h-main-content`. */
    className?: string;
    width?: number;
    /**
     * Set by a host that decides itself when the panel shows, such as the Website Builder editor: the panel
     * then always renders, and its close button calls this. Without it the panel shows while the AI
     * chats presenter says it is open.
     */
    onClose?: () => void;
    /** The close button's label and icon, for a host where closing collapses the panel. */
    closeLabel?: string;
    closeIcon?: React.JSX.Element;
}

/**
 * The AI chats side panel, for a screen that renders without the admin frame (the Website Builder
 * editor) and still wants the assistant beside it. Renders nothing until an admin UI package
 * decorates it; `@webiny/app-admin-ui` does.
 */
export const AiChatsPanelRenderer = makeDecoratable(
    "AiChatsPanelRenderer",
    createVoidComponent<AiChatsPanelProps>()
);
