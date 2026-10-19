import { createAbstraction } from "@webiny/feature/admin";

export interface IAiChatRowViewModel {
    id: string;
    title: string;
    savedOn: string;
    /** The chat the assistant is holding right now. */
    active: boolean;
}

export interface IAiChatsPanelViewModel {
    isOpen: boolean;
    chats: IAiChatRowViewModel[];
    loading: boolean;
    hasMore: boolean;
    /** Why reading or deleting chats failed. */
    error: string | null;
}

/**
 * The AI chats side panel: the saved chats, and the conversation the assistant holds.
 *
 * The conversation itself stays in `AdminAssistantPresenter`, so the palette and the panel show
 * one conversation, and a palette conversation handed over to the panel carries on where it was.
 */
export interface IAiChatsPanelPresenter {
    readonly vm: IAiChatsPanelViewModel;
    /** Open the panel on whatever the assistant holds, and read the chats. */
    open(): void;
    close(): void;
    /** Open a saved chat in the panel's conversation. */
    select(chatId: string): void;
    /** Leave the current chat, which stays saved, for an empty conversation. */
    startNew(): void;
    remove(chatId: string): Promise<void>;
    loadMore(): void;
}

export const AiChatsPanelPresenter =
    createAbstraction<IAiChatsPanelPresenter>("AiChatsPanelPresenter");

export namespace AiChatsPanelPresenter {
    export type Interface = IAiChatsPanelPresenter;
    export type ViewModel = IAiChatsPanelViewModel;
    export type Row = IAiChatRowViewModel;
}
