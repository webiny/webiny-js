import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AdminAssistantGateway } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter as PresenterAbstraction } from "~/features/adminAssistant/abstractions";
import type { AdminAssistantStreamEvent } from "~/features/adminAssistant/abstractions";
import { AdminAssistantPresenter } from "~/features/adminAssistant/AdminAssistantPresenter.js";

/** A gateway that answers every request with the same events, then ends. */
const setup = (events: AdminAssistantStreamEvent[]) => {
    const container = new Container();

    container.registerInstance(AdminAssistantGateway, {
        stream: async function* () {
            yield* events;
        }
    });
    container.register(AdminAssistantPresenter);

    return container.resolve(PresenterAbstraction);
};

/** `ask` starts the run without waiting for it, so let the stream drain first. */
const settle = async (presenter: PresenterAbstraction.Interface) => {
    for (let i = 0; i < 20 && presenter.vm.busy; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

const DONE: AdminAssistantStreamEvent = { type: "done", messages: [], steps: 1 };

describe("AdminAssistantPresenter", () => {
    it("knows no model until a run names one", async () => {
        const presenter = setup([
            { type: "start", model: "anthropic/claude-sonnet-4-5" },
            { type: "text", text: "3 products." },
            DONE
        ]);

        expect(presenter.vm.model).toBeUndefined();

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        expect(presenter.vm.model).toBe("anthropic/claude-sonnet-4-5");
    });

    it("keeps the follow-ups the run suggested on its turn", async () => {
        const presenter = setup([
            { type: "start", model: "anthropic/claude-sonnet-4-5" },
            { type: "text", text: "3 products." },
            { type: "follow-ups", questions: ["Which of these are low on stock?"] },
            DONE
        ]);

        presenter.ask("Which products are on sale?");
        await settle(presenter);

        const [turn] = presenter.vm.turns;
        expect(turn.settled).toBe(true);
        expect(turn.followUps).toEqual(["Which of these are low on stock?"]);
    });

    it("starts a turn with no follow-ups", () => {
        const presenter = setup([]);

        presenter.ask("Which products are on sale?");

        expect(presenter.vm.turns[0].followUps).toEqual([]);
    });

    /*
     * The text before an approval pause and the text after it come from separate runs, so nothing
     * on the server can separate them.
     */
    it("starts a new paragraph when a resumed run writes on", async () => {
        const runs: AdminAssistantStreamEvent[][] = [
            [
                { type: "text", text: "I'll add a new folder:" },
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
                DONE
            ],
            [{ type: "text", text: "No folder was created." }, DONE]
        ];
        const container = new Container();
        container.registerInstance(AdminAssistantGateway, {
            stream: async function* () {
                yield* runs.shift() ?? [];
            }
        });
        container.register(AdminAssistantPresenter);
        const presenter = container.resolve(PresenterAbstraction);

        presenter.ask("Create a folder for products");
        await settle(presenter);
        presenter.decide(0, false);
        await settle(presenter);

        expect(presenter.vm.turns[0].text).toBe("I'll add a new folder:\n\nNo folder was created.");
    });

    /*
     * A collapsed turn summarises its answer in a line. The text before the last tool call is the
     * model saying what it will look up, so the summary has to start after it.
     */
    it("marks where the answer starts, after the last tool call", async () => {
        const presenter = setup([
            { type: "text", text: "I'll check the models." },
            { type: "tool-call", name: "listContentModels" },
            { type: "tool-result", name: "listContentModels" },
            { type: "text", text: "\n\n6 content models." },
            DONE
        ]);

        presenter.ask("What content models does this project have?");
        await settle(presenter);

        const [turn] = presenter.vm.turns;
        expect(turn.text.slice(turn.answerStart).trim()).toBe("6 content models.");
    });
});
