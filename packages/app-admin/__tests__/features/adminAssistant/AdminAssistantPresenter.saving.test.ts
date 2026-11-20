import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AdminAssistantGateway } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter as PresenterAbstraction } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantMessage } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantRequest } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantStreamEvent } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter } from "~/features/adminAssistant/AdminAssistantPresenter.js";
import { AssistantPageContext } from "~/features/assistantPageContext/AssistantPageContext.js";
import { AiChatsRepository } from "~/features/aiChats/abstractions";
import { AssistantPageContext as PageContextAbstraction } from "~/features/assistantPageContext/abstractions.js";
import { createFakeChats } from "./createFakeChats.js";

const answer = (text: string): AdminAssistantMessage => ({
    role: "assistant",
    content: [{ type: "text", text }]
});

const saved = (id: string): AiChatsRepository.Summary => ({
    id,
    title: "Chat",
    createdOn: "2026-10-19T10:00:00.000Z",
    savedOn: "2026-10-19T10:00:00.000Z"
});

/** Each run takes the next list of events. Every request is recorded. */
const setup = (runs: AdminAssistantStreamEvent[][]) => {
    const container = new Container();
    const chats = createFakeChats();
    const requests: AdminAssistantRequest[] = [];

    container.registerInstance(AdminAssistantGateway, {
        stream: async function* (request: AdminAssistantRequest) {
            requests.push(request);
            yield* runs.shift() ?? [];
        }
    });
    container.registerInstance(AiChatsRepository, chats.repository);
    container.register(AssistantPageContext).inSingletonScope();
    container.register(AdminAssistantPresenter);

    return {
        presenter: container.resolve(PresenterAbstraction),
        pageContext: container.resolve(PageContextAbstraction),
        chats,
        requests
    };
};

/** Lets the stream drain. */
const settle = async (presenter: PresenterAbstraction.Interface) => {
    for (let i = 0; i < 20 && (presenter.vm.busy || presenter.vm.opening); i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

/** A run the server answered and saved as `chatId`. */
const run = (text: string, chatId = "chat-1"): AdminAssistantStreamEvent[] => [
    { type: "text", text },
    { type: "saved", chat: saved(chatId) },
    { type: "done", steps: 1 }
];

const notSaved = (text: string, retryable: boolean): AdminAssistantStreamEvent[] => [
    { type: "text", text },
    { type: "not-saved", message: "The chat could not be saved.", retryable },
    { type: "done", steps: 1 }
];

const paused = (chatId = "chat-1"): AdminAssistantStreamEvent[] => [
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
    { type: "saved", chat: saved(chatId) },
    { type: "done", steps: 1 }
];

describe("AdminAssistantPresenter saving", () => {
    it("sends only the question, and keeps the id the server saved the chat as", async () => {
        const { presenter, chats, requests } = setup([run("3 products.")]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        expect(requests).toEqual([{ prompt: "Which products are on sale?" }]);
        expect(presenter.vm.chatId).toBe("chat-1");
        expect(chats.remembered).toEqual([saved("chat-1")]);
    });

    it("asks a later question in the same chat, without the conversation", async () => {
        const { presenter, requests } = setup([run("3 products."), run("The mug.")]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.ask("Which is cheapest?");
        await settle(presenter);

        expect(requests[1]).toEqual({ chatId: "chat-1", prompt: "Which is cheapest?" });
    });

    it("sends a decision with the chat it resumes", async () => {
        const { presenter, requests } = setup([paused(), run("No folder was created.")]);

        presenter.ask("Create a folder for products");
        await settle(presenter);
        presenter.decide(0, false);
        await settle(presenter);

        expect(requests[1]).toEqual({
            chatId: "chat-1",
            approvals: [{ approvalId: "a1", approved: false }]
        });
        expect(presenter.vm.turns[0].pendingApprovals).toEqual([]);
    });

    it("sends what the screen says about itself with a question, but not with a decision", async () => {
        const { presenter, pageContext, requests } = setup([paused(), run("No folder.")]);
        const products = { view: "Entries of the Product content model", details: {} };
        pageContext.set(products);

        presenter.ask("Create a folder for products");
        await settle(presenter);
        presenter.decide(0, false);
        await settle(presenter);

        expect(requests[0]).toEqual({
            prompt: "Create a folder for products",
            pageContext: products
        });
        expect(requests[1]).not.toHaveProperty("pageContext");
    });

    it("asks again with the screen the user is on now", async () => {
        const { presenter, pageContext, requests } = setup([
            [{ type: "error", message: "Provider timed out." }],
            run("3 products.")
        ]);
        const products = { view: "Entries of the Product content model", details: {} };
        const articles = { view: "Entries of the Article content model", details: {} };
        const owner = pageContext.set(products);

        presenter.ask("List the entries");
        await settle(presenter);
        pageContext.clear(owner);
        pageContext.set(articles);
        presenter.retry();
        await settle(presenter);

        expect(requests[0].pageContext).toEqual(products);
        expect(requests[1].pageContext).toEqual(articles);
    });

    // The server rejects a change still waiting when something else is asked, so the card goes too.
    it("drops a change still waiting when another question is asked", async () => {
        const { presenter } = setup([paused(), run("6 models.")]);

        presenter.ask("Create a folder for products");
        await settle(presenter);
        presenter.ask("What content models are there?");
        await settle(presenter);

        expect(presenter.vm.turns[0].pendingApprovals).toEqual([]);
        expect(presenter.vm.turns).toHaveLength(2);
    });

    // The paused run is resumed from the saved chat, which does not have it.
    it("refuses a decision on a run that was not saved", async () => {
        const { presenter, requests } = setup([
            [
                ...paused().filter(event => event.type !== "saved" && event.type !== "done"),
                { type: "not-saved", message: "Too large.", retryable: false },
                { type: "done", steps: 1 }
            ]
        ]);

        presenter.ask("Create a folder for products");
        await settle(presenter);
        presenter.decide(0, true);
        await settle(presenter);

        expect(requests).toHaveLength(1);
        expect(presenter.vm.turns[0].pendingApprovals).toEqual([]);
        expect(presenter.vm.turns[0].error).toMatch(/wasn't saved/);
    });

    it("starts a new chat after a reset", async () => {
        const { presenter, requests } = setup([run("3 products."), run("6 models.", "chat-2")]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.reset();
        expect(presenter.vm.chatId).toBeNull();

        presenter.ask("What content models are there?");
        await settle(presenter);

        expect(requests[1]).toEqual({ prompt: "What content models are there?" });
        expect(presenter.vm.chatId).toBe("chat-2");
    });

    it("says why a run was not saved, and keeps the conversation", async () => {
        const { presenter } = setup([notSaved("3 products.", false)]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        expect(presenter.vm.storageError).toBe("The chat could not be saved.");
        expect(presenter.vm.saveFailure).toBe("final");
        expect(presenter.vm.turns[0].text).toBe("3 products.");
        expect(presenter.vm.turns[0].settled).toBe(true);
    });

    // The saved chat does not have the answer, so asking again answers it afresh and saves it.
    it("asks again in place of a run that was not saved", async () => {
        const { presenter, requests } = setup([
            run("3 products."),
            notSaved("The mug.", true),
            run("The mug, again.")
        ]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.ask("Which is cheapest?");
        await settle(presenter);
        presenter.retry();
        await settle(presenter);

        expect(requests[2]).toEqual({ chatId: "chat-1", prompt: "Which is cheapest?" });
        expect(presenter.vm.turns).toHaveLength(2);
        expect(presenter.vm.turns[1].text).toBe("The mug, again.");
        expect(presenter.vm.storageError).toBeNull();
        expect(presenter.vm.saveFailure).toBeNull();
    });

    /*
     * The decision may have carried out the change. Asking again would start from before it, so the
     * model would propose it again, and approving it a second time would make it twice.
     */
    it("offers only a new chat when a resumed run was not saved", async () => {
        const { presenter, requests } = setup([
            paused(),
            notSaved("Created the folder.", true),
            run("Not used.")
        ]);

        presenter.ask("Create a folder for products");
        await settle(presenter);
        presenter.decide(0, true);
        await settle(presenter);
        expect(presenter.vm.saveFailure).toBe("final");

        presenter.retry();
        await settle(presenter);
        expect(requests).toHaveLength(2);
    });

    it("does nothing on retry when the newest turn is fine", async () => {
        const { presenter, requests } = setup([run("3 products.")]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);
        presenter.retry();
        await settle(presenter);

        expect(requests).toHaveLength(1);
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
        const { presenter, requests } = setup([
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
        expect(requests[1]).toEqual({ prompt: "Which products are on sale?" });
    });
});

describe("AdminAssistantPresenter opening a chat", () => {
    const stored = {
        ...saved("chat-1"),
        messages: [{ role: "user", content: "Which products are on sale?" }, answer("3 products.")]
    };

    it("rebuilds the turns, and continues the chat on the next question", async () => {
        const { presenter, chats, requests } = setup([run("The mug.")]);
        chats.put(stored);

        await presenter.open("chat-1");

        expect(presenter.vm.chatId).toBe("chat-1");
        expect(presenter.vm.turns).toHaveLength(1);
        expect(presenter.vm.turns[0].question).toBe("Which products are on sale?");
        expect(presenter.vm.turns[0].text).toBe("3 products.");

        presenter.ask("Which is cheapest?");
        await settle(presenter);

        expect(requests).toEqual([{ chatId: "chat-1", prompt: "Which is cheapest?" }]);
    });

    it("says why a chat could not be opened", async () => {
        const { presenter } = setup([]);

        await presenter.open("missing");

        expect(presenter.vm.storageError).toBe('Chat "missing" was not found.');
        expect(presenter.vm.opening).toBe(false);
        expect(presenter.vm.chatId).toBeNull();
    });

    it("refuses a question while a saved chat is loading", async () => {
        const { presenter, chats, requests } = setup([run("Ignored.")]);
        chats.put(stored);

        const opening = presenter.open("chat-1");
        presenter.ask("Which is cheapest?");
        await opening;
        await settle(presenter);

        expect(presenter.vm.turns.map(turn => turn.question)).toEqual([
            "Which products are on sale?"
        ]);
        expect(requests).toEqual([]);
    });
});
