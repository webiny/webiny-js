import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AdminAssistantGateway } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter as PresenterAbstraction } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantRequest } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantStreamEvent } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter } from "~/features/adminAssistant/AdminAssistantPresenter.js";
import { AssistantPageContext } from "~/features/assistantPageContext/AssistantPageContext.js";
import { AssistantPageContext as PageContextAbstraction } from "~/features/assistantPageContext/abstractions.js";
import { AssistantClientTools } from "~/features/assistantClientTools/AssistantClientTools.js";
import { AssistantClientTools as ClientToolsAbstraction } from "~/features/assistantClientTools/abstractions.js";
import { AiChatsRepository } from "~/features/aiChats/abstractions";
import { createFakeChats } from "./createFakeChats.js";

const SAVED = {
    id: "chat-1",
    title: "Chat",
    createdOn: "2026-11-17T10:00:00.000Z",
    savedOn: "2026-11-17T10:00:00.000Z"
};

const call = { toolCallId: "call-1", toolName: "addPageElements", input: { component: "Hero" } };

/** A run that paused on one browser call, saved. */
const pausedOnCall: AdminAssistantStreamEvent[] = [
    { type: "text", text: "Adding a hero." },
    { type: "tool-call", name: "addPageElements" },
    { type: "client-tools", calls: [call] },
    { type: "saved", chat: SAVED },
    { type: "done", steps: 1 }
];

const answered: AdminAssistantStreamEvent[] = [
    { type: "text", text: "Done: the hero is at the top." },
    { type: "saved", chat: SAVED },
    { type: "done", steps: 1 }
];

const setup = (runs: AdminAssistantStreamEvent[][]) => {
    const container = new Container();
    const requests: AdminAssistantRequest[] = [];

    container.registerInstance(AdminAssistantGateway, {
        stream: async function* (request: AdminAssistantRequest) {
            requests.push(request);
            yield* runs.shift() ?? [];
        }
    });
    container.registerInstance(AiChatsRepository, createFakeChats().repository);
    container.register(AssistantPageContext).inSingletonScope();
    container.register(AssistantClientTools).inSingletonScope();
    container.register(AdminAssistantPresenter);

    return {
        presenter: container.resolve(PresenterAbstraction),
        clientTools: container.resolve(ClientToolsAbstraction),
        pageContext: container.resolve(PageContextAbstraction),
        requests
    };
};

const settle = async (presenter: PresenterAbstraction.Interface) => {
    for (let i = 0; i < 50 && presenter.vm.busy; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

const addElements = (execute: (input: unknown) => Promise<unknown>) => ({
    name: "addPageElements",
    description: "Adds elements to the page.",
    inputSchema: { type: "object" },
    execute
});

describe("AdminAssistantPresenter client tools", () => {
    it("tells the server which tools the screen runs, and none once it is gone", async () => {
        const { presenter, clientTools, requests } = setup([answered, answered]);
        const owner = clientTools.register([addElements(async () => null)]);

        presenter.ask("Add a hero");
        await settle(presenter);
        clientTools.unregister(owner);
        presenter.ask("And now?");
        await settle(presenter);

        expect(requests[0].clientTools).toEqual([
            {
                name: "addPageElements",
                description: "Adds elements to the page.",
                inputSchema: { type: "object" }
            }
        ]);
        expect(requests[1].clientTools).toBeUndefined();
    });

    it("runs the call the run paused on, then resumes it with the result", async () => {
        const { presenter, clientTools, pageContext, requests } = setup([pausedOnCall, answered]);
        const inputs: unknown[] = [];
        clientTools.register([
            addElements(async input => {
                inputs.push(input);
                return { added: ["el-1"] };
            })
        ]);
        pageContext.set({ view: "Page editor", details: { title: "Home" } });

        presenter.ask("Add a hero");
        await settle(presenter);

        expect(inputs).toEqual([{ component: "Hero" }]);
        expect(requests[1]).toMatchObject({
            chatId: "chat-1",
            toolResults: [
                { toolCallId: "call-1", toolName: "addPageElements", output: { added: ["el-1"] } }
            ],
            // The page as the call left it.
            pageContext: { view: "Page editor", details: { title: "Home" } }
        });
        const [turn] = presenter.vm.turns;
        expect(turn.completed).toEqual(["addPageElements"]);
        expect(turn.text).toBe("Adding a hero.\n\nDone: the hero is at the top.");
        expect(turn.settled).toBe(true);
    });

    it("reports a call that threw as an error the model can correct", async () => {
        const { presenter, clientTools, requests } = setup([pausedOnCall, answered]);
        clientTools.register([
            addElements(async () => {
                throw new Error('No component named "Hero".');
            })
        ]);

        presenter.ask("Add a hero");
        await settle(presenter);

        expect(requests[1].toolResults).toEqual([
            {
                toolCallId: "call-1",
                toolName: "addPageElements",
                error: 'No component named "Hero".'
            }
        ]);
        expect(presenter.vm.turns[0].failed).toEqual(["addPageElements"]);
    });

    it("reports a call whose screen has gone instead of leaving the run paused", async () => {
        const { presenter, requests } = setup([pausedOnCall, answered]);

        presenter.ask("Add a hero");
        await settle(presenter);

        expect(requests[1].toolResults).toEqual([
            {
                toolCallId: "call-1",
                toolName: "addPageElements",
                error: "The screen that runs this tool is no longer open."
            }
        ]);
    });

    it("sends the results with the decision when an approval came too", async () => {
        const withApproval: AdminAssistantStreamEvent[] = [
            {
                type: "approval",
                approvals: [
                    {
                        approvalId: "a1",
                        toolName: "createFolder",
                        input: { title: "Pages" },
                        destructive: false
                    }
                ]
            },
            ...pausedOnCall.slice(1)
        ];
        const { presenter, clientTools, requests } = setup([withApproval, answered]);
        clientTools.register([addElements(async () => ({ added: ["el-1"] }))]);

        presenter.ask("Add a hero and a folder");
        await settle(presenter);

        // Nothing goes back until the user decides.
        expect(requests).toHaveLength(1);

        presenter.decide(0, true);
        await settle(presenter);

        expect(requests[1]).toMatchObject({
            chatId: "chat-1",
            approvals: [{ approvalId: "a1", approved: true }],
            toolResults: [{ toolCallId: "call-1", output: { added: ["el-1"] } }]
        });
    });

    it("does not resume a run that was not saved", async () => {
        const notSaved: AdminAssistantStreamEvent[] = [
            { type: "client-tools", calls: [call] },
            { type: "not-saved", message: "Store down.", retryable: true },
            { type: "done", steps: 1 }
        ];
        const { presenter, clientTools, requests } = setup([notSaved]);
        clientTools.register([addElements(async () => null)]);

        presenter.ask("Add a hero");
        await settle(presenter);

        expect(requests).toHaveLength(1);
        expect(presenter.vm.turns[0].error).toContain("wasn't saved");
    });
});
