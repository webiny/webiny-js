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
import { AssistantClientTools } from "~/features/assistantClientTools/AssistantClientTools.js";
import { AssistantComposerControls } from "~/features/assistantComposerControls/AssistantComposerControls.js";
import { AssistantComposerControls as ControlsAbstraction } from "~/features/assistantComposerControls/abstractions.js";
import { AiChatsRepository } from "~/features/aiChats/abstractions";
import { createFakeChats } from "./createFakeChats.js";

const SAVED = {
    id: "chat-1",
    title: "Chat",
    createdOn: "2026-11-17T10:00:00.000Z",
    savedOn: "2026-11-17T10:00:00.000Z"
};

const answered: AdminAssistantStreamEvent[] = [
    { type: "text", text: "Done." },
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
    container.register(AssistantComposerControls).inSingletonScope();
    container.register(AdminAssistantPresenter);

    return {
        presenter: container.resolve(PresenterAbstraction),
        controls: container.resolve(ControlsAbstraction),
        requests
    };
};

const settle = async (presenter: PresenterAbstraction.Interface) => {
    for (let i = 0; i < 50 && presenter.vm.busy; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

describe("AdminAssistantPresenter composer controls", () => {
    it("sends what the screen's controls are set to, and nothing once the screen is gone", async () => {
        const { presenter, controls, requests } = setup([answered, answered]);
        let projectId = "velo";
        const owner = controls.register([
            { name: "promptContext", element: null, value: () => ({ projectId }) }
        ]);

        projectId = "velo-trade";
        presenter.ask("Build the page");
        await settle(presenter);
        controls.unregister(owner);
        presenter.ask("And now?");
        await settle(presenter);

        // Read when asked, not when registered: the user may change it between questions.
        expect(requests[0].controls).toEqual({ promptContext: { projectId: "velo-trade" } });
        expect(requests[1].controls).toBeUndefined();
    });

    it("sends nothing for a control that is not set", async () => {
        const { presenter, controls, requests } = setup([answered]);
        controls.register([{ name: "promptContext", element: null, value: () => undefined }]);

        presenter.ask("Build the page");
        await settle(presenter);

        expect(requests[0].controls).toBeUndefined();
    });
});
