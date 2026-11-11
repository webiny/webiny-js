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
import { AiChatSaveError } from "~/features/aiChats/AiChatSaveError.js";
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

    // The reason picks the fix the view offers: a new chat for "too large", a retry otherwise.
    it("tells a chat that is too large from a server that could not be reached", async () => {
        const { presenter, chats } = setup([run("3 products."), run("6 models.")]);
        chats.repository.save = async () => {
            throw new AiChatSaveError("The chat is too large.", "too-large");
        };

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        expect(presenter.vm.saveFailure).toBe("too-large");

        chats.repository.save = async () => {
            throw new TypeError("Failed to fetch");
        };
        presenter.ask("What content models are there?");
        await settle(presenter);
        expect(presenter.vm.saveFailure).toBe("unreachable");
    });

    it("saves again on retry, and clears the failure once it succeeds", async () => {
        const { presenter, chats } = setup([run("3 products.")]);
        const save = chats.repository.save;
        chats.repository.save = async () => {
            throw new TypeError("Failed to fetch");
        };

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        expect(presenter.vm.saveFailure).toBe("unreachable");

        chats.repository.save = save;
        presenter.retrySave();
        await settle(presenter);

        expect(chats.saves).toHaveLength(1);
        expect(presenter.vm.chatId).toBe("chat-1");
        expect(presenter.vm.storageError).toBeNull();
        expect(presenter.vm.saveFailure).toBeNull();
    });

    /*
     * A turn waiting on an approval holds every save back. Retrying then saves nothing, so the
     * warning has to stay until the save after the decision clears it.
     */
    it("keeps the warning when a retry cannot save yet", async () => {
        const { presenter, chats } = setup([
            run("3 products."),
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
        const save = chats.repository.save;
        chats.repository.save = async () => {
            throw new TypeError("Failed to fetch");
        };

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        chats.repository.save = save;
        presenter.ask("Create a folder for products");
        await settle(presenter);

        expect(presenter.vm.savePaused).toBe(true);
        presenter.retrySave();
        await settle(presenter);
        expect(chats.saves).toHaveLength(0);
        expect(presenter.vm.saveFailure).toBe("unreachable");

        presenter.decide(1, false);
        await settle(presenter);
        expect(presenter.vm.savePaused).toBe(false);
        expect(chats.saves).toHaveLength(1);
        expect(presenter.vm.saveFailure).toBeNull();
    });
});

describe("AdminAssistantPresenter retrying a failed turn", () => {
    it("keeps the server's code on the failed turn", async () => {
        const { presenter } = setup([
            [{ type: "error", message: "No model.", code: "AI_CAPABILITY_NOT_CONFIGURED" }]
        ]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        expect(presenter.vm.turns[0].needsSetup).toBe(true);
        expect(presenter.vm.setupRequired).toBe(true);
    });

    it("refuses a new question until the failed one is asked again", async () => {
        const { presenter } = setup([
            [{ type: "error", message: "No model.", code: "AI_CAPABILITY_NOT_CONFIGURED" }],
            run("Not used.")
        ]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.ask("What content models are there?");
        await settle(presenter);

        expect(presenter.vm.turns).toHaveLength(1);
        expect(presenter.vm.turns[0].question).toBe("Which products are on sale?");
    });

    it("asks the same question again in place of the failed turn", async () => {
        const { presenter, chats } = setup([
            [{ type: "error", message: "No model.", code: "AI_CAPABILITY_NOT_CONFIGURED" }],
            run("3 products.")
        ]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.retry();
        await settle(presenter);

        expect(presenter.vm.turns).toHaveLength(1);
        expect(presenter.vm.turns[0].error).toBeUndefined();
        expect(presenter.vm.turns[0].needsSetup).toBe(false);
        expect(presenter.vm.setupRequired).toBe(false);
        expect(presenter.vm.turns[0].text).toBe("3 products.");
        expect(chats.saves[0].messages[0]).toEqual({
            role: "user",
            content: "Which products are on sale?"
        });
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

    it("refuses a question while a saved chat is loading", async () => {
        const { presenter, chats } = setup([run("Ignored.")]);
        await chats.repository.save({
            messages: [
                { role: "user", content: "Which products are on sale?" },
                answer("3 products.")
            ]
        });
        const savesBefore = chats.saves.length;

        const opening = presenter.open("chat-1");
        presenter.ask("Which is cheapest?");
        await opening;
        await settle(presenter);

        expect(presenter.vm.turns.map(turn => turn.question)).toEqual([
            "Which products are on sale?"
        ]);
        expect(chats.saves).toHaveLength(savesBefore);
    });
});
