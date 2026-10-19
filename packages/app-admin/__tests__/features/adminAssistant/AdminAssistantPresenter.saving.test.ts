import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AdminAssistantGateway } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter as PresenterAbstraction } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantMessage } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantStreamEvent } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter } from "~/features/adminAssistant/AdminAssistantPresenter.js";
import { AiChatsRepository } from "~/features/aiChats/abstractions";
import { createFakeChats } from "./createFakeChats.js";

const answer = (text: string): AdminAssistantMessage => ({
    role: "assistant",
    content: [{ type: "text", text }]
});

/** Each run takes the next list of events. */
const setup = (runs: AdminAssistantStreamEvent[][]) => {
    const container = new Container();
    const chats = createFakeChats();

    container.registerInstance(AdminAssistantGateway, {
        stream: async function* () {
            yield* runs.shift() ?? [];
        }
    });
    container.registerInstance(AiChatsRepository, chats.repository);
    container.register(AdminAssistantPresenter);

    return { presenter: container.resolve(PresenterAbstraction), chats };
};

/** Lets the stream drain and the queued saves finish. */
const settle = async (presenter: PresenterAbstraction.Interface) => {
    for (let i = 0; i < 20 && (presenter.vm.busy || presenter.vm.opening); i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

const run = (text: string): AdminAssistantStreamEvent[] => [
    { type: "text", text },
    { type: "done", messages: [answer(text)], steps: 1 }
];

describe("AdminAssistantPresenter saving", () => {
    it("saves a new chat after the first answer, and keeps its id", async () => {
        const { presenter, chats } = setup([run("3 products.")]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        expect(chats.saves).toEqual([
            {
                messages: [
                    { role: "user", content: "Which products are on sale?" },
                    answer("3 products.")
                ]
            }
        ]);
        expect(presenter.vm.chatId).toBe("chat-1");
    });

    it("saves every later turn into the same chat, with the whole conversation", async () => {
        const { presenter, chats } = setup([run("3 products."), run("The mug.")]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.ask("Which is cheapest?");
        await settle(presenter);

        expect(chats.saves).toHaveLength(2);
        expect(chats.saves[1]).toEqual({
            id: "chat-1",
            messages: [
                { role: "user", content: "Which products are on sale?" },
                answer("3 products."),
                { role: "user", content: "Which is cheapest?" },
                answer("The mug.")
            ]
        });
    });

    it("does not save a turn that failed", async () => {
        const { presenter, chats } = setup([[{ type: "error", message: "No model." }]]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        expect(chats.saves).toEqual([]);
        expect(presenter.vm.chatId).toBeNull();
    });

    /*
     * The paused request is answered by a decision the server never stored. Saving before it would
     * leave a chat that cannot resume, so the save waits for the decision.
     */
    it("waits for an approval decision before saving", async () => {
        const { presenter, chats } = setup([
            [
                { type: "text", text: "I'll add a folder:" },
                {
                    type: "approval",
                    approvals: [
                        {
                            approvalId: "a1",
                            toolName: "createFolder",
                            input: { title: "Products" },
                            destructive: false
                        }
                    ]
                },
                { type: "done", messages: [answer("I'll add a folder:")], steps: 1 }
            ],
            run("No folder was created.")
        ]);

        presenter.ask("Create a folder for products");
        await settle(presenter);
        expect(chats.saves).toEqual([]);

        presenter.decide(0, false);
        await settle(presenter);
        expect(chats.saves).toHaveLength(1);
    });

    it("starts a new chat after a reset", async () => {
        const { presenter, chats } = setup([run("3 products."), run("6 models.")]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.reset();
        expect(presenter.vm.chatId).toBeNull();

        presenter.ask("What content models are there?");
        await settle(presenter);

        expect(chats.saves[1].id).toBeUndefined();
        expect(presenter.vm.chatId).toBe("chat-2");
    });

    it("says why a save failed, and keeps the conversation", async () => {
        const { presenter, chats } = setup([run("3 products.")]);
        chats.repository.save = async () => {
            throw new Error("The chat is too long to save.");
        };

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        expect(presenter.vm.storageError).toBe("The chat is too long to save.");
        expect(presenter.vm.turns).toHaveLength(1);
    });
});

describe("AdminAssistantPresenter opening a chat", () => {
    it("rebuilds the turns, and continues the chat on the next question", async () => {
        const { presenter, chats } = setup([run("The mug.")]);
        await chats.repository.save({
            messages: [
                { role: "user", content: "Which products are on sale?" },
                answer("3 products.")
            ]
        });

        await presenter.open("chat-1");

        expect(presenter.vm.chatId).toBe("chat-1");
        expect(presenter.vm.turns).toHaveLength(1);
        expect(presenter.vm.turns[0].question).toBe("Which products are on sale?");
        expect(presenter.vm.turns[0].text).toBe("3 products.");

        presenter.ask("Which is cheapest?");
        await settle(presenter);

        const last = chats.saves[chats.saves.length - 1];
        expect(last.id).toBe("chat-1");
        expect(last.messages).toHaveLength(4);
    });

    it("says why a chat could not be opened", async () => {
        const { presenter } = setup([]);

        await presenter.open("missing");

        expect(presenter.vm.storageError).toBe('Chat "missing" was not found.');
        expect(presenter.vm.opening).toBe(false);
        expect(presenter.vm.chatId).toBeNull();
    });
});
