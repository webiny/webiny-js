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

const setup = (
    activeChatId: string | null,
    saved: AiChatsRepository.Summary[] = [
        { id: "a", title: "Sale prices", createdOn: "", savedOn: "2026-10-19T10:00:00.000Z" },
        { id: "b", title: "Content models", createdOn: "", savedOn: "2026-10-19T09:00:00.000Z" }
    ]
) => {
    const container = new Container();
    const chats = createFakeChats(saved);

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

    it("groups the chats by the day they were last saved", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 26, 15, 0));
        try {
            const { presenter } = setup(null, [
                {
                    id: "a",
                    title: "Sale prices",
                    createdOn: "",
                    savedOn: new Date(2026, 9, 26, 9, 41).toISOString()
                },
                {
                    id: "b",
                    title: "API keys",
                    createdOn: "",
                    savedOn: new Date(2026, 9, 25, 23, 59).toISOString()
                },
                {
                    id: "c",
                    title: "Blog migration",
                    createdOn: "",
                    savedOn: new Date(2026, 9, 20, 12, 0).toISOString()
                }
            ]);

            expect(
                presenter.vm.groups.map(group => [group.label, group.chats.map(c => c.id)])
            ).toEqual([
                ["Today", ["a"]],
                ["Yesterday", ["b"]],
                ["Earlier", ["c"]]
            ]);
        } finally {
            vi.useRealTimers();
        }
    });

    it("filters the chats by title, and leaves out the groups the search empties", () => {
        const { presenter } = setup(null);

        presenter.setSearch("  SALE ");

        expect(presenter.vm.groups.flatMap(group => group.chats.map(chat => chat.id))).toEqual([
            "a"
        ]);
        // The full list stays, so the panel can tell "no chats" from "no match".
        expect(presenter.vm.chats).toHaveLength(2);
    });

    it("toggles between the saved chats and closed", () => {
        const { presenter } = setup(null);

        presenter.toggleHistory();
        expect(presenter.vm).toMatchObject({ isOpen: true, view: "history" });

        presenter.toggleHistory();
        expect(presenter.vm.isOpen).toBe(false);
    });

    it("titles the conversation after its chat, or New chat before it is saved", () => {
        expect(setup("b").presenter.vm.conversationTitle).toBe("Content models");
        expect(setup(null).presenter.vm.conversationTitle).toBe("New chat");
    });
});
