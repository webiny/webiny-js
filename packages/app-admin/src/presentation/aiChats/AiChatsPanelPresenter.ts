import { makeAutoObservable } from "mobx";
import { AiChatsRepository } from "~/features/aiChats/abstractions.js";
import { AdminAssistantPresenter } from "~/features/adminAssistant/abstractions.js";
import { AiChatsPanelPresenter as Abstraction } from "./abstractions.js";
import type { AiChatsPanelView } from "./abstractions.js";
import type { IAiChatsPanelViewModel } from "./abstractions.js";
import type { IAiChatGroupViewModel } from "./abstractions.js";
import type { IAiChatRowViewModel } from "./abstractions.js";
import type { AiChatDay } from "./abstractions.js";

const DAY_LABELS: Record<AiChatDay, string> = {
    today: "Today",
    yesterday: "Yesterday",
    earlier: "Earlier"
};

/** Local midnight, so "today" means the user's day rather than UTC's. */
const startOfDay = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const dayOf = (savedOn: string, today: number): AiChatDay => {
    const saved = startOfDay(new Date(savedOn));
    if (saved >= today) {
        return "today";
    }
    // Not `today - 24h`: a day with a daylight-saving change is 23 or 25 hours long.
    const yesterday = startOfDay(new Date(today - 1));
    return saved >= yesterday ? "yesterday" : "earlier";
};

const groupByDay = (rows: IAiChatRowViewModel[]): IAiChatGroupViewModel[] => {
    const today = startOfDay(new Date());
    const groups: IAiChatGroupViewModel[] = (["today", "yesterday", "earlier"] as const).map(
        day => ({ day, label: DAY_LABELS[day], chats: [] })
    );

    for (const row of rows) {
        const day = dayOf(row.savedOn, today);
        groups.find(group => group.day === day)!.chats.push(row);
    }

    return groups.filter(group => group.chats.length > 0);
};

const messageOf = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

class AiChatsPanelPresenterImpl implements Abstraction.Interface {
    private isOpen = false;
    private view: AiChatsPanelView = "conversation";
    private removeError: string | null = null;
    private search = "";

    constructor(
        private chats: AiChatsRepository.Interface,
        private assistant: AdminAssistantPresenter.Interface
    ) {
        // Collaborators, not state. Each keeps its own observables.
        makeAutoObservable<AiChatsPanelPresenterImpl, "chats" | "assistant">(this, {
            chats: false,
            assistant: false
        });
    }

    get vm(): IAiChatsPanelViewModel {
        const activeId = this.assistant.vm.chatId;
        const activeChat = this.chats.chats.find(chat => chat.id === activeId);
        const rows = this.chats.chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            savedOn: chat.savedOn,
            active: chat.id === activeId
        }));
        const needle = this.search.trim().toLowerCase();
        const matches = needle
            ? rows.filter(row => row.title.toLowerCase().includes(needle))
            : rows;

        return {
            isOpen: this.isOpen,
            view: this.view,
            conversationTitle: activeChat?.title ?? "New chat",
            chats: rows,
            search: this.search,
            groups: groupByDay(matches),
            loading: this.chats.loading,
            hasMore: this.chats.hasMore,
            error: this.removeError ?? this.chats.error
        };
    }

    open(): void {
        this.isOpen = true;
        this.view = "conversation";
    }

    close(): void {
        this.isOpen = false;
    }

    showHistory(): void {
        this.view = "history";
        this.removeError = null;
        void this.chats.load();
    }

    toggleHistory(): void {
        if (this.isOpen && this.view === "history") {
            this.close();
            return;
        }
        this.isOpen = true;
        this.showHistory();
    }

    showConversation(): void {
        this.view = "conversation";
    }

    select(chatId: string): void {
        this.view = "conversation";
        if (chatId === this.assistant.vm.chatId) {
            return;
        }
        void this.assistant.open(chatId);
    }

    startNew(): void {
        this.view = "conversation";
        this.assistant.reset();
    }

    async remove(chatId: string): Promise<void> {
        this.setRemoveError(null);

        /*
         * Deleting the chat on screen drops the conversation too, or the next turn would save into a
         * chat that no longer exists.
         */
        if (chatId === this.assistant.vm.chatId) {
            this.assistant.reset();
        }

        try {
            await this.chats.delete(chatId);
        } catch (error) {
            this.setRemoveError(messageOf(error));
        }
    }

    setSearch(search: string): void {
        this.search = search;
    }

    loadMore(): void {
        void this.chats.loadMore();
    }

    private setRemoveError(message: string | null): void {
        this.removeError = message;
    }
}

export const AiChatsPanelPresenter = Abstraction.createImplementation({
    implementation: AiChatsPanelPresenterImpl,
    dependencies: [AiChatsRepository, AdminAssistantPresenter]
});
