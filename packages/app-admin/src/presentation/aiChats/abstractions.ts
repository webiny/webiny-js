import { createAbstraction } from "@webiny/feature/admin";

export interface IAiChatRowViewModel {
    id: string;
    title: string;
    savedOn: string;
    /** The chat the assistant is holding right now. */
    active: boolean;
}

/** Which day a chat was last saved on, relative to today. */
export type AiChatDay = "today" | "yesterday" | "earlier";

export interface IAiChatGroupViewModel {
    day: AiChatDay;
    /** "Today", "Yesterday" or "Earlier". */
    label: string;
    chats: IAiChatRowViewModel[];
}

/** The panel shows one conversation, or the saved chats to pick one from. */
export type AiChatsPanelView = "conversation" | "history";

export interface IAiChatsPanelViewModel {
    isOpen: boolean;
    view: AiChatsPanelView;
    /** The open chat's title, or "New chat" before its first question is saved. */
    conversationTitle: string;
    /** Every chat read so far, newest created first. */
    chats: IAiChatRowViewModel[];
    /** What is typed in the chats search. */
    search: string;
    /** The chats whose title matches `search`, by the day they were last saved. Empty groups are left out. */
    groups: IAiChatGroupViewModel[];
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
    /** Open the panel on whatever the assistant holds. */
    open(): void;
    close(): void;
    /** Show the saved chats, read fresh. */
    showHistory(): void;
    /** Open the panel on the saved chats, or close it when it already shows them. */
    toggleHistory(): void;
    /** Back to the conversation the assistant holds. */
    showConversation(): void;
    /** Open a saved chat, and show it. */
    select(chatId: string): void;
    /** Leave the current chat, which stays saved, for an empty conversation, and show it. */
    startNew(): void;
    remove(chatId: string): Promise<void>;
    /** Filter the saved chats by title. Only the chats read so far are searched. */
    setSearch(search: string): void;
    loadMore(): void;
}

export const AiChatsPanelPresenter =
    createAbstraction<IAiChatsPanelPresenter>("AiChatsPanelPresenter");

export namespace AiChatsPanelPresenter {
    export type Interface = IAiChatsPanelPresenter;
    export type ViewModel = IAiChatsPanelViewModel;
    export type Row = IAiChatRowViewModel;
    export type Group = IAiChatGroupViewModel;
    export type Day = AiChatDay;
    export type View = AiChatsPanelView;
}
