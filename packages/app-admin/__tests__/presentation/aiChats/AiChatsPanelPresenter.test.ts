import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { AiChatsRepository } from "~/features/aiChats/abstractions";
import { AdminAssistantPresenter } from "~/features/adminAssistant/abstractions";
import { AiChatsPanelPresenter as PresenterAbstraction } from "~/presentation/aiChats/abstractions";
import { AiChatsPanelPresenter } from "~/presentation/aiChats/AiChatsPanelPresenter.js";
import { createFakeChats } from "../../features/adminAssistant/createFakeChats.js";

const setup = (activeChatId: string | null) => {
    const container = new Container();
    const chats = createFakeChats([
        { id: "a", title: "Sale prices", createdOn: "", savedOn: "2026-10-19T10:00:00.000Z" },
        { id: "b", title: "Content models", createdOn: "", savedOn: "2026-10-19T09:00:00.000Z" }
    ]);

    const assistant: AdminAssistantPresenter.Interface = {
        vm: { turns: [], busy: false, chatId: activeChatId, opening: false, storageError: null },
        ask: vi.fn(),
        decide: vi.fn(),
        reset: vi.fn(),
        open: vi.fn(async () => {})
    };

    container.registerInstance(AiChatsRepository, chats.repository);
    container.registerInstance(AdminAssistantPresenter, assistant);
    container.register(AiChatsPanelPresenter);

    return { presenter: container.resolve(PresenterAbstraction), assistant };
};

describe("AiChatsPanelPresenter", () => {
    it("marks the chat the assistant holds as active", () => {
        const { presenter } = setup("b");

        expect(presenter.vm.chats.map(chat => [chat.id, chat.active])).toEqual([
            ["a", false],
            ["b", true]
        ]);
    });

    it("opens a chat in the assistant", () => {
        const { presenter, assistant } = setup("a");

        presenter.select("b");

        expect(assistant.open).toHaveBeenCalledWith("b");
    });

    it("does not reopen the chat already open", () => {
        const { presenter, assistant } = setup("a");

        presenter.select("a");

        expect(assistant.open).not.toHaveBeenCalled();
    });

    it("drops the conversation when its chat is deleted", async () => {
        const { presenter, assistant } = setup("a");

        await presenter.remove("a");

        expect(assistant.reset).toHaveBeenCalled();
    });

    it("keeps the conversation when another chat is deleted", async () => {
        const { presenter, assistant } = setup("a");

        await presenter.remove("b");

        expect(assistant.reset).not.toHaveBeenCalled();
    });

    it("opens on the conversation, and shows the saved chats on request", () => {
        const { presenter } = setup(null);

        presenter.open();
        expect(presenter.vm.view).toBe("conversation");

        presenter.showHistory();
        expect(presenter.vm.view).toBe("history");
    });

    it("goes back to the conversation when a chat is picked or a new one started", () => {
        const { presenter } = setup("a");

        presenter.showHistory();
        presenter.select("b");
        expect(presenter.vm.view).toBe("conversation");

        presenter.showHistory();
        presenter.startNew();
        expect(presenter.vm.view).toBe("conversation");
    });
});
