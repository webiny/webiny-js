import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import type { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { DeleteModelTask } from "@webiny/api-headless-cms-tasks/features/DeleteModelTask/DeleteModelTask.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";
import { DeleteModelOperations } from "@webiny/api-headless-cms-tasks/graphql/deleteModel/abstractions.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { ADMIN_ACTOR, createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createDbModel } from "~tests/__helpers/dbModels.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { READER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { RecordingDeleteModelOperations } from "~tests/__helpers/RecordingDeleteModelOperations.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import { createTaskController } from "~tests/__helpers/taskController.js";
import { registerNoFolders } from "~tests/__helpers/NoFolders.js";

describe("Model delete block (D41, D64)", () => {
    it("refuses to delete a model bound to a workflow and lists the workflow", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        await createDbModel(ctx, "book");
        const workflow = expectOk(
            await storeWorkflow(ctx, { ...createWorkflowValues(["cms.book"]), name: "Book review" })
        );

        const blocked = await ctx.container.resolve(DeleteModelUseCase).execute("book");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Model/BoundToWorkflow");
        expect(blocked.error.data).toEqual({
            modelId: "book",
            workflows: [{ id: workflow.id, name: "Book review" }]
        });
        expect(blocked.error.message).toBe(
            'The model "book" is used by the workflow "Book review". Delete the workflow or remove the model from it first.'
        );
        expect((await ctx.container.resolve(GetModelUseCase).execute("book")).isOk()).toBe(true);
    });

    it("deletes the model once its workflow is gone", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        await createDbModel(ctx, "book");
        const workflow = expectOk(await storeWorkflow(ctx, createWorkflowValues(["cms.book"])));
        expectOk(
            await ctx.container
                .resolve(DeleteWorkflowUseCase)
                .execute({ id: workflow.id, actor: ADMIN_ACTOR })
        );

        // Under `test:os` the workflow list must not lag behind the delete (A37).
        const deleted = await ctx.container.resolve(DeleteModelUseCase).execute("book");

        expect(deleted.isOk()).toBe(true);
    });

    it("deletes a model without a workflow normally", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        await createDbModel(ctx, "magazine");

        const deleted = await ctx.container.resolve(DeleteModelUseCase).execute("magazine");

        expect(deleted.isOk()).toBe(true);
    });

    it("reports the CMS's own error to a caller who cannot delete the model", async () => {
        const admin = createContextHandler();
        const adminCtx = await admin.context();
        await createDbModel(adminCtx, "book");
        expectOk(await storeWorkflow(adminCtx, createWorkflowValues(["cms.book"])));
        const reader = createContextHandler({ identity: READER, permissions: CMS_READER });

        const refused = await (
            await reader.context()
        ).container
            .resolve(DeleteModelUseCase)
            .execute("book");

        expect(refused.isFail()).toBe(true);
        expect(refused.error.code).toBe("Cms/Model/NotAuthorized");
        // Nothing about the bound workflow reaches the caller (R64).
        expect(refused.error.data).toBeUndefined();
        expect(refused.error.message).not.toContain("workflow");
    });

    it("refuses to delete a bound singleton model before its entry is deleted", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        const settings = await createDbModel(ctx, "settings", [CMS_MODEL_SINGLETON_TAG]);
        const entry = expectOk(
            await ctx.container.resolve(CreateEntryUseCase).execute(settings, {
                values: { title: "Kept" },
                location: { folderId: "root" }
            })
        );
        expectOk(await storeWorkflow(ctx, createWorkflowValues(["cms.settings"])));

        const blocked = await ctx.container.resolve(DeleteModelUseCase).execute("settings");

        expect(blocked.error.code).toBe("Workflows/Model/BoundToWorkflow");
        const kept = await ctx.container
            .resolve(GetRevisionByIdUseCase)
            .execute(settings, entry.id);
        expect(kept.isOk()).toBe(true);
    });

    it("blocks deleting a model when the workflow lookup fails (fail closed)", async () => {
        const { context } = createContextHandler({ legacyPlugins: [failListWorkflows] });
        const ctx = await context();
        await createDbModel(ctx, "magazine");

        const blocked = await ctx.container.resolve(DeleteModelUseCase).execute("magazine");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/Persistence");
    });
});

describe("Fully delete model task (D134 point 4)", () => {
    const createTaskContext = async (legacyPlugins: unknown[] = []) => {
        const operations = new RecordingDeleteModelOperations();
        const { context } = createContextHandler({
            legacyPlugins: [
                (container: Container) => {
                    container.registerInstance(DeleteModelOperations, operations);
                },
                ...legacyPlugins
            ]
        });
        const ctx = await context();
        return { context: ctx, operations };
    };

    it("refuses to start the task for a bound model, before anything is deleted", async () => {
        const { context, operations } = await createTaskContext();
        await createDbModel(context, "book");
        expectOk(
            await storeWorkflow(context, {
                ...createWorkflowValues(["cms.book"]),
                name: "Book review"
            })
        );

        await expect(
            context.container.resolve(DeleteModelOperations).fullyDeleteModel("book")
        ).rejects.toMatchObject({
            code: "Workflows/Model/BoundToWorkflow",
            data: { modelId: "book" }
        });
        expect(operations.fullyDeleted).toEqual([]);
    });

    it("starts the task for a model without a workflow", async () => {
        const { context, operations } = await createTaskContext();
        await createDbModel(context, "magazine");

        const task = await context.container
            .resolve(DeleteModelOperations)
            .fullyDeleteModel("magazine");

        expect(task.id).toBe("task-1");
        expect(operations.fullyDeleted).toEqual(["magazine"]);
    });

    it("leaves a caller who cannot delete the model to the task's own checks (R64)", async () => {
        const admin = createContextHandler();
        const adminCtx = await admin.context();
        await createDbModel(adminCtx, "book");
        expectOk(await storeWorkflow(adminCtx, createWorkflowValues(["cms.book"])));
        const operations = new RecordingDeleteModelOperations();
        const reader = createContextHandler({
            identity: READER,
            permissions: CMS_READER,
            legacyPlugins: [
                (container: Container) => {
                    container.registerInstance(DeleteModelOperations, operations);
                }
            ]
        });

        const task = await (
            await reader.context()
        ).container
            .resolve(DeleteModelOperations)
            .fullyDeleteModel("book");

        // The recording stands in for the task operations, whose own checks refuse the reader;
        // the guard never answers with the bound workflow.
        expect(task.id).toBe("task-1");
        expect(operations.fullyDeleted).toEqual(["book"]);
    });

    it("refuses to start the task when the workflow lookup fails (fail closed)", async () => {
        const { context, operations } = await createTaskContext([failListWorkflows]);
        await createDbModel(context, "magazine");

        await expect(
            context.container.resolve(DeleteModelOperations).fullyDeleteModel("magazine")
        ).rejects.toMatchObject({ code: "Workflows/Workflow/Persistence" });
        expect(operations.fullyDeleted).toEqual([]);
    });
});

describe("Delete model task run (triggerTask, D134 point 4)", () => {
    /** Runs the task's handler as the task runner does: decorated, without authorization. */
    const runDeleteModelTask = async (context: CmsContext, modelId: string) => {
        const definition = context.container.resolveImplementation(DeleteModelTask);
        const handler = context.container.resolveImplementation(definition.handler);
        return context.container.resolve(IdentityContext).withoutAuthorization(() => {
            return handler.run({
                input: { modelId },
                controller: createTaskController(),
                definition
            });
        });
    };

    const createBookEntry = async (context: CmsContext, model: CmsModel): Promise<CmsEntry> => {
        return expectOk(
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                values: { title: "Kept" },
                location: { folderId: "root" }
            })
        );
    };

    it("refuses to run for a bound model and leaves its entries in place", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        const book = await createDbModel(ctx, "book");
        const entry = await createBookEntry(ctx, book);
        expectOk(
            await storeWorkflow(ctx, { ...createWorkflowValues(["cms.book"]), name: "Book review" })
        );

        await expect(runDeleteModelTask(ctx, "book")).rejects.toMatchObject({
            code: "Workflows/Model/BoundToWorkflow",
            data: { modelId: "book" }
        });
        const kept = await ctx.container.resolve(GetRevisionByIdUseCase).execute(book, entry.id);
        expect(kept.isOk()).toBe(true);
        expect((await ctx.container.resolve(GetModelUseCase).execute("book")).isOk()).toBe(true);
    });

    it("refuses to run when the workflow lookup fails (fail closed)", async () => {
        const { context } = createContextHandler({ legacyPlugins: [failListWorkflows] });
        const ctx = await context();
        const magazine = await createDbModel(ctx, "magazine");
        const entry = await createBookEntry(ctx, magazine);

        await expect(runDeleteModelTask(ctx, "magazine")).rejects.toMatchObject({
            code: "Workflows/Workflow/Persistence"
        });
        const kept = await ctx.container
            .resolve(GetRevisionByIdUseCase)
            .execute(magazine, entry.id);
        expect(kept.isOk()).toBe(true);
    });

    it("runs for a model without a workflow", async () => {
        const { context } = createContextHandler({ legacyPlugins: [registerNoFolders] });
        const ctx = await context();
        const magazine = await createDbModel(ctx, "magazine");
        await createBookEntry(ctx, magazine);

        const result = await runDeleteModelTask(ctx, "magazine");

        expect(result.status).toBe("done");
        expect((await ctx.container.resolve(GetModelUseCase).execute("magazine")).isFail()).toBe(
            true
        );
    });
});
