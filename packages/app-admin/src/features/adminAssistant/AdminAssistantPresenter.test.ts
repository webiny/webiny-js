import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import {
    AdminAssistantGateway,
    AdminAssistantPresenter as PresenterAbstraction,
    type AdminAssistantStreamEvent
} from "./abstractions.js";
import { AdminAssistantPresenter } from "./AdminAssistantPresenter.js";

/** A gateway that plays back one scripted run per call. */
const createPresenter = (runs: AdminAssistantStreamEvent[][]) => {
    const container = new Container();
    container.registerInstance(AdminAssistantGateway, {
        async *stream() {
            yield* runs.shift() ?? [];
        }
    });
    container.register(AdminAssistantPresenter).inSingletonScope();

    return container.resolve(PresenterAbstraction);
};

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

const approval = {
    approvalId: "a1",
    toolName: "createFolder",
    title: "Create folder",
    input: { title: "Drafts" },
    destructive: false
};

describe("AdminAssistantPresenter", () => {
    it("starts a new paragraph when text follows a tool call", async () => {
        const presenter = createPresenter([
            [
                { type: "text", text: "I'll look up the models first." },
                { type: "tool-call", name: "listContentModels" },
                { type: "tool-result", name: "listContentModels" },
                { type: "text", text: "There are " },
                { type: "text", text: "3 models." },
                { type: "done", messages: [], steps: 2 }
            ]
        ]);

        presenter.ask("What models are there?");
        await settle();

        expect(presenter.vm.turns[0].text).toBe(
            "I'll look up the models first.\n\nThere are 3 models."
        );
    });

    it("does not open with a break when a tool call comes before any text", async () => {
        const presenter = createPresenter([
            [
                { type: "tool-call", name: "listContentModels" },
                { type: "tool-result", name: "listContentModels" },
                { type: "text", text: "3 models." },
                { type: "done", messages: [], steps: 2 }
            ]
        ]);

        presenter.ask("What models are there?");
        await settle();

        expect(presenter.vm.turns[0].text).toBe("3 models.");
    });

    it("starts a new paragraph when an approved turn resumes", async () => {
        const presenter = createPresenter([
            [
                { type: "text", text: "I'll create that folder." },
                { type: "tool-call", name: "createFolder" },
                { type: "approval", approvals: [approval] },
                { type: "done", messages: [], steps: 1 }
            ],
            [
                { type: "tool-result", name: "createFolder" },
                { type: "text", text: "Created." },
                { type: "done", messages: [], steps: 1 }
            ]
        ]);

        presenter.ask("Create a folder called Drafts");
        await settle();
        presenter.decide(0, true);
        await settle();

        expect(presenter.vm.turns[0].text).toBe("I'll create that folder.\n\nCreated.");
    });

    it("records a rejected call so it is not shown as one that ran", async () => {
        const presenter = createPresenter([
            [
                { type: "tool-call", name: "createFolder" },
                { type: "approval", approvals: [approval] },
                { type: "done", messages: [], steps: 1 }
            ],
            [
                { type: "tool-result", name: "createFolder" },
                { type: "text", text: "Cancelled." },
                { type: "done", messages: [], steps: 1 }
            ]
        ]);

        presenter.ask("Create a folder called Drafts");
        await settle();
        presenter.decide(0, false);
        await settle();

        expect(presenter.vm.turns[0].rejected).toEqual(["createFolder"]);
    });

    it("records nothing as rejected when the call is approved", async () => {
        const presenter = createPresenter([
            [
                { type: "tool-call", name: "createFolder" },
                { type: "approval", approvals: [approval] },
                { type: "done", messages: [], steps: 1 }
            ],
            [
                { type: "tool-result", name: "createFolder" },
                { type: "done", messages: [], steps: 1 }
            ]
        ]);

        presenter.ask("Create a folder called Drafts");
        await settle();
        presenter.decide(0, true);
        await settle();

        expect(presenter.vm.turns[0].rejected).toEqual([]);
    });
});
