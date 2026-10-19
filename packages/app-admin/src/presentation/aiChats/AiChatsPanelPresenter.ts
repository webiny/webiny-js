import { makeAutoObservable } from "mobx";
import { AiChatsRepository } from "~/features/aiChats/abstractions.js";
import { AdminAssistantPresenter } from "~/features/adminAssistant/abstractions.js";
import { AiChatsPanelPresenter as Abstraction } from "./abstractions.js";
import type { IAiChatsPanelViewModel } from "./abstractions.js";

const messageOf = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

class AiChatsPanelPresenterImpl implements Abstraction.Interface {
    private isOpen = false;
    private removeError: string | null = null;

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

        return {
            isOpen: this.isOpen,
            chats: this.chats.chats.map(chat => ({
                id: chat.id,
                title: chat.title,
                savedOn: chat.savedOn,
                active: chat.id === activeId
            })),
            loading: this.chats.loading,
            hasMore: this.chats.hasMore,
            error: this.removeError ?? this.chats.error
        };
    }

    open(): void {
        this.isOpen = true;
        this.removeError = null;
        void this.chats.load();
    }

    close(): void {
        this.isOpen = false;
    }

    select(chatId: string): void {
        if (chatId === this.assistant.vm.chatId) {
            return;
        }
        void this.assistant.open(chatId);
    }

    startNew(): void {
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
