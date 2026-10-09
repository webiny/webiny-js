import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL, createWorkflowValues } from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const STALE_SAVED_ON = "2000-01-01T00:00:00.000Z";

const createUseCases = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });

    return {
        storeWorkflow: context.container.resolve(StoreWorkflowUseCase),
        getWorkflow: context.container.resolve(GetWorkflowUseCase),
        listWorkflows: context.container.resolve(ListWorkflowsUseCase),
        deleteWorkflow: context.container.resolve(DeleteWorkflowUseCase)
    };
};

describe("Workflow use cases", () => {
    it("returns an empty list for an empty models_in without querying the CMS", async () => {
        let cmsListCalls = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.registerDecorator(
                    ListLatestEntriesUseCase.createDecorator({
                        decorator: class {
                            constructor(private decoratee: ListLatestEntriesUseCase.Interface) {}
                            async execute(
                                ...args: Parameters<ListLatestEntriesUseCase.Interface["execute"]>
                            ) {
                                cmsListCalls++;
                                return this.decoratee.execute(...args);
                            }
                        } as never,
                        dependencies: []
                    })
                );
            }
        });
        const storeWorkflow = context.container.resolve(StoreWorkflowUseCase);
        const listWorkflows = context.container.resolve(ListWorkflowsUseCase);
        await storeWorkflow.execute({ workflow: createWorkflowValues() });
        cmsListCalls = 0;

        const listed = await listWorkflows.execute({ where: { models_in: [] } });

        expect(listed.isOk()).toBe(true);
        expect(listed.value.items).toEqual([]);
        expect(listed.value.meta).toEqual({ cursor: null, hasMoreItems: false, totalCount: 0 });
        expect(cmsListCalls).toBe(0);
    });

    it("stores exactly what it returns and what events carry", async () => {
        const { storeWorkflow, getWorkflow } = await createUseCases();
        const base = createWorkflowValues();
        const [first, second] = base.steps;
        const { color: _color, ...withoutColor } = first;
        const values = createWorkflowValues({
            steps: [{ ...withoutColor, description: "  " } as typeof first, second]
        });

        const created = await storeWorkflow.execute({ workflow: values });
        expect(created.isOk()).toBe(true);
        const read = await getWorkflow.execute({ id: values.id });
        expect(read.value).toEqual(created.value);

        const before = recordedEvents.find(e => e.eventType === "Workflows/Workflow/BeforeCreate");
        const after = recordedEvents.find(e => e.eventType === "Workflows/Workflow/AfterCreate");
        const afterWorkflow = after!.payload.workflow;
        expect(before!.payload.workflow).toEqual({
            id: afterWorkflow.id,
            name: afterWorkflow.name,
            models: afterWorkflow.models,
            steps: afterWorkflow.steps
        });
        expect(created.value.steps[0]).not.toHaveProperty("description");
        expect(created.value.steps[0].color).toBe("");
    });

    it("creates, reads, lists, updates and deletes a workflow", async () => {
        const { storeWorkflow, getWorkflow, listWorkflows, deleteWorkflow } =
            await createUseCases();
        const values = createWorkflowValues();

        const created = await storeWorkflow.execute({ workflow: values });
        expect(created.isOk()).toBe(true);
        expect(created.value).toMatchObject(values);
        expect(created.value.savedOn).toEqual(expect.any(String));
        expect(created.value.savedBy.id).toEqual(expect.any(String));

        const read = await getWorkflow.execute({ id: values.id });
        expect(read.value).toEqual(created.value);

        const listed = await listWorkflows.execute({ where: { models_in: [ARTICLE_MODEL] } });
        expect(listed.value.items.map(item => item.id)).toEqual([values.id]);

        const otherModel = await listWorkflows.execute({ where: { models_in: ["cms.other"] } });
        expect(otherModel.value.items).toEqual([]);

        const updated = await storeWorkflow.execute({
            workflow: { ...values, name: "Article review v2" },
            savedOn: created.value.savedOn
        });
        expect(updated.isOk()).toBe(true);
        expect(updated.value.name).toBe("Article review v2");

        const deleted = await deleteWorkflow.execute({ id: values.id });
        expect(deleted.isOk()).toBe(true);

        const afterDelete = await getWorkflow.execute({ id: values.id });
        expect(afterDelete.isFail()).toBe(true);
        expect(afterDelete.error.code).toBe("Workflows/Workflow/NotFound");

        expect(workflowEventTypes()).toEqual([
            "Workflows/Workflow/BeforeCreate",
            "Workflows/Workflow/AfterCreate",
            "Workflows/Workflow/BeforeUpdate",
            "Workflows/Workflow/AfterUpdate",
            "Workflows/Workflow/BeforeDelete",
            "Workflows/Workflow/AfterDelete"
        ]);
    });

    it("validates through the same path on create and update", async () => {
        const { storeWorkflow } = await createUseCases();

        const invalidCreate = await storeWorkflow.execute({
            workflow: createWorkflowValues({ steps: [] })
        });
        expect(invalidCreate.isFail()).toBe(true);
        expect(invalidCreate.error.code).toBe("Workflows/Workflow/Validation");
        expect(invalidCreate.error.message).toBe("Add at least one step.");

        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });
        const invalidUpdate = await storeWorkflow.execute({
            workflow: createWorkflowValues({ steps: [] }),
            savedOn: created.value.savedOn
        });
        expect(invalidUpdate.isFail()).toBe(true);
        expect(invalidUpdate.error.message).toBe("Add at least one step.");
        expect(workflowEventTypes()).toEqual([
            "Workflows/Workflow/BeforeCreate",
            "Workflows/Workflow/AfterCreate"
        ]);
    });

    it("rejects a save with a stale savedOn", async () => {
        const { storeWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ name: "Changed" }),
            savedOn: STALE_SAVED_ON
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: created.value.savedOn,
            savedBy: created.value.savedBy
        });
    });

    it("rejects creating a workflow over an existing one", async () => {
        const { storeWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: created.value.savedOn,
            savedBy: created.value.savedBy
        });
    });

    it("does not recreate a workflow deleted while it was being edited", async () => {
        const { storeWorkflow, deleteWorkflow, getWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });
        await deleteWorkflow.execute({ id: created.value.id });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ name: "Changed" }),
            savedOn: created.value.savedOn
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        expect(result.error.data).toEqual({ id: created.value.id });
        const read = await getWorkflow.execute({ id: created.value.id });
        expect(read.isFail()).toBe(true);
    });

    it("allows one workflow per model", async () => {
        const { storeWorkflow } = await createUseCases();
        await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ id: "workflow-2", name: "Second review" })
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'The model "cms.article" already has a workflow: "Article review".'
        );
    });

    it("returns NotFound for unknown workflows", async () => {
        const { getWorkflow, deleteWorkflow } = await createUseCases();

        const read = await getWorkflow.execute({ id: "missing" });
        expect(read.isFail()).toBe(true);
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");

        const deleted = await deleteWorkflow.execute({ id: "missing" });
        expect(deleted.isFail()).toBe(true);
        expect(deleted.error.code).toBe("Workflows/Workflow/NotFound");
    });
});
