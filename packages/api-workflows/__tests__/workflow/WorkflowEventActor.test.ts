import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createWorkflowValues,
    editor,
    expectOk,
    otherReviewer
} from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const createUseCases = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    return {
        storeWorkflow: context.container.resolve(StoreWorkflowUseCase),
        deleteWorkflow: context.container.resolve(DeleteWorkflowUseCase)
    };
};

const actorOf = (eventType: string) => {
    const event = recordedEvents.find(item => item.eventType === eventType);
    return event?.payload.actor;
};

describe("Workflow events carry the actor (R58)", () => {
    it("puts the creating, updating and deleting actor on every workflow event", async () => {
        const { storeWorkflow, deleteWorkflow } = await createUseCases();

        const created = expectOk(
            await storeWorkflow.execute({ workflow: createWorkflowValues(), actor: editor })
        );
        expectOk(
            await storeWorkflow.execute({
                workflow: createWorkflowValues({ name: "Article review v2" }),
                savedOn: created.savedOn,
                actor: otherReviewer
            })
        );
        expectOk(await deleteWorkflow.execute({ id: created.id, actor: editor }));

        expect(actorOf("Workflows/Workflow/BeforeCreate")).toEqual(editor);
        expect(actorOf("Workflows/Workflow/AfterCreate")).toEqual(editor);
        expect(actorOf("Workflows/Workflow/BeforeUpdate")).toEqual(otherReviewer);
        expect(actorOf("Workflows/Workflow/AfterUpdate")).toEqual(otherReviewer);
        expect(actorOf("Workflows/Workflow/BeforeDelete")).toEqual(editor);
        expect(actorOf("Workflows/Workflow/AfterDelete")).toEqual(editor);
    });
});
