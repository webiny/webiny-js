import { createVoidComponent, makeDecoratable } from "@webiny/app";

export interface AiChatsPanelProps {
    /** Sizes the panel's height to its host. The admin frame uses `h-main-content`. */
    className?: string;
    width?: number;
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
