import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewGet, reviewGetFaults } from "~tests/__helpers/FailingReviewGet.js";
import {
    RecordingStaleCheck,
    staleCheckBypassStates
} from "~tests/__helpers/RecordingStaleCheck.js";
import {
    FakeReviewTargetEditor,
    fakeEditor,
    holdFakeEditorUpdate,
    resetFakeEditor
} from "~tests/__helpers/FakeReviewTargetEditor.js";
import { createAiToolContext } from "~tests/__helpers/aiToolContext.js";
import { expectOk, requester } from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { UPDATE_TARGET_FIELDS_TOOL_NAME } from "~/features/aiTools/constants.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

const setup = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.register(FakeReviewTargetEditor);
            container.registerDecorator(FailingReviewGet);
            container.registerDecorator(RecordingStaleCheck);
        }
    });
    const tool = context.container
        .resolve(WorkflowAiToolRegistryService)
        .get(UPDATE_TARGET_FIELDS_TOOL_NAME);
    if (!tool) {
        throw new Error("The updateTargetFields tool is not registered.");
    }
    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);
    const toolContext = createAiToolContext();

    return {
        tool,
        toolContext,
        bypass: context.container.resolve(WorkflowBypassService),
        /** Stores the running review the context describes. */
        seed: async (): Promise<void> => {
            expectOk(await repository.save(toolContext.review));
            reviewGetFaults.reads = 0;
        },
        /** Cancels the stored review, as the requester would while the model runs. */
        cancel: async (): Promise<void> => {
            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.cancel({ actor: requester, now: LATER }));
            expectOk(await saver.save(review));
            reviewGetFaults.reads = 0;
        },
        /** Restarts the step under another task, as the restart use case would. */
        moveToAnotherTask: async (): Promise<void> => {
            const data = expectOk(await repository.get("review-1"));
            data.steps[0].taskId = "task-new";
            expectOk(await repository.save(data));
            reviewGetFaults.reads = 0;
        }
    };
};

describe("updateTargetFields tool (R172, R173)", () => {
    beforeEach(() => {
        resetFakeEditor();
        reviewGetFaults.mode = null;
        reviewGetFaults.reads = 0;
        loggedErrors.length = 0;
        staleCheckBypassStates.length = 0;
    });

    describe("input", () => {
        it("is named updateTargetFields and takes only fields", async () => {
            const { tool } = await setup();

            expect(tool.name).toBe("updateTargetFields");
            expect(tool.title).toBe("Update target fields");
            expect(tool.inputSchema.safeParse({ fields: { title: "New" } }).success).toBe(true);
            expect(tool.inputSchema.safeParse({}).success).toBe(false);
            expect(tool.inputSchema.safeParse({ fields: "title" }).success).toBe(false);
            expect(
                tool.inputSchema.parse({
                    fields: { title: "New" },
                    targetId: "forged",
                    reviewId: "forged"
                })
            ).toEqual({ fields: { title: "New" } });
        });

        it("writes the review's own target and takes no id from the input (Review Focus 2)", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                {
                    fields: { title: "New title" },
                    model: "cms.other",
                    targetId: "forged-target",
                    targetRevisionId: "forged-revision",
                    reviewId: "forged-review"
                },
                toolContext
            );

            expect(result.ok).toBe(true);
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.updateCalls[0]).toMatchObject({
                model: "cms.article",
                targetId: "article-1",
                targetRevisionId: "article-1#0001",
                values: { title: "New title" }
            });
            expect(Object.keys(fakeEditor.updateCalls[0].values)).toEqual(["title"]);
        });

        it("writes nothing and says so when no fields are given", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute({ fields: {} }, toolContext);

            expect(result).toEqual({ ok: false, error: "No fields were given." });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(reviewGetFaults.reads).toBe(0);
        });
    });

    describe("result", () => {
        it("answers the applied paths and changes the content", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New title", body: "New body" } },
                toolContext
            );

            expect(result).toEqual({ ok: true, data: { applied: ["title", "body"] } });
            expect(fakeEditor.content.fields.map(field => field.value)).toEqual([
                "New title",
                "New body",
                { id: "author-1" }
            ]);
        });

        it("answers the editor's refusal text, writes nothing and does not fail the step", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New title", author: "x" } },
                toolContext
            );

            expect(result).toEqual({ ok: false, error: 'The field "author" cannot be written.' });
            expect(fakeEditor.content.fields[0].value).toBe("Hello");
            expect(loggedErrors).toEqual([]);
        });

        it("answers the editor's failure text when the target rejects a value", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            fakeEditor.updateFault = "fail";
            fakeEditor.faultMessage = 'The value of "title" is not valid.';

            const result = await tool.execute({ fields: { title: "" } }, toolContext);

            expect(result).toEqual({ ok: false, error: 'The value of "title" is not valid.' });
            expect(loggedErrors).toEqual([]);
        });

        it("answers a fixed text and logs the real error when the editor throws (R87)", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            fakeEditor.updateFault = "throw";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The target could not be updated." });
            expect(JSON.stringify(result)).not.toContain("Storage threw");
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe("The AI tool could not update the target.");
            expect(loggedErrors[0].fields).toEqual({
                err: expect.objectContaining({ message: "Storage threw." }),
                reviewId: "review-1",
                stepId: toolContext.step.id,
                taskId: "task-1"
            });
        });

        it("answers the cannot-be-edited text for a namespace with no editor", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New" } },
                { ...toolContext, review: { ...toolContext.review, model: "wb.page" } }
            );

            expect(result).toEqual({ ok: false, error: "This target cannot be edited." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });
    });

    describe("stale re-check (R173, R175, Review Focus 1)", () => {
        it("re-reads the stored review right before the write, outside the bypass", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result.ok).toBe(true);
            expect(reviewGetFaults.reads).toBe(1);
            expect(staleCheckBypassStates).toEqual([false]);
            expect(fakeEditor.updateCalls).toHaveLength(1);
        });

        it("writes nothing when the stored review was cancelled during the call", async () => {
            const { tool, toolContext, seed, cancel } = await setup();
            await seed();
            // `toolContext.review` is the snapshot the run started with: it still looks running.
            await cancel();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(fakeEditor.content.fields[0].value).toBe("Hello");
        });

        it("writes nothing when the step was restarted under a new task", async () => {
            const { tool, toolContext, seed, moveToAnotherTask } = await setup();
            await seed();
            await moveToAnotherTask();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });

        it("writes nothing when the review was deleted", async () => {
            const { tool, toolContext } = await setup();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("writes nothing for a task that does not own the step", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New" } },
                { ...toolContext, task: { id: "task-old", createdById: requester.id } }
            );

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });

        it("writes nothing for a task somebody else created", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New" } },
                { ...toolContext, task: { id: "task-1", createdById: "user-intruder" } }
            );

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });

        it("checks again for every write: a write after a cancel writes nothing", async () => {
            const { tool, toolContext, seed, cancel } = await setup();
            await seed();

            const first = await tool.execute({ fields: { title: "First" } }, toolContext);
            await cancel();
            const second = await tool.execute({ fields: { body: "Second" } }, toolContext);

            expect(first).toEqual({ ok: true, data: { applied: ["title"] } });
            expect(second).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.content.fields.map(field => field.value)).toEqual([
                "First",
                "Body text",
                { id: "author-1" }
            ]);
        });

        it("refuses and writes nothing when the stored review cannot be read, and does not log again", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            reviewGetFaults.mode = "fail";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({
                ok: false,
                error: "The step could not be checked; nothing was written."
            });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(fakeEditor.content.fields[0].value).toBe("Hello");
            // The service logged the failed read once; the tool adds no second log.
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(
                "Could not read the review to check the step is current."
            );
        });

        it("refuses and writes nothing when the read of the stored review throws", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            reviewGetFaults.mode = "throw";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({
                ok: false,
                error: "The step could not be checked; nothing was written."
            });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(
                "Could not read the review to check the step is current."
            );
        });

        it("refuses a second write once the check starts failing after a first write landed", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const first = await tool.execute({ fields: { title: "First" } }, toolContext);
            reviewGetFaults.mode = "fail";
            const second = await tool.execute({ fields: { body: "Second" } }, toolContext);

            expect(first).toEqual({ ok: true, data: { applied: ["title"] } });
            expect(second).toEqual({
                ok: false,
                error: "The step could not be checked; nothing was written."
            });
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.content.fields.map(field => field.value)).toEqual([
                "First",
                "Body text",
                { id: "author-1" }
            ]);
        });
    });

    describe("bypass (R173, D36, D62, R150, Review Focus 4)", () => {
        it("is active inside the awaited write and inactive right after update returns", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result.ok).toBe(true);
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(fakeEditor.updateCalls[0].bypassActiveAfterAwait).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("is inactive right after update returns a refusal", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();

            const result = await tool.execute({ fields: { author: "x" } }, toolContext);

            expect(result.ok).toBe(false);
            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("is inactive right after update throws", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();
            fakeEditor.updateFault = "throw";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The target could not be updated." });
            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(fakeEditor.updateCalls[0].bypassActiveAfterAwait).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("is never active when nothing is written (stale)", async () => {
            const { tool, toolContext, bypass } = await setup();

            await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(fakeEditor.updateCalls).toEqual([]);
            expect(staleCheckBypassStates).toEqual([false]);
            expect(bypass.isActive()).toBe(false);
        });

        it("is not active for a save started outside the tool while the update is in flight", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();
            const held = holdFakeEditorUpdate();

            const pending = tool.execute({ fields: { title: "New" } }, toolContext);
            await held.started;
            // Work started outside the tool, e.g. a save by a user, while the update is in flight.
            const outside = await Promise.resolve().then(() => bypass.isActive());
            const outsideDeferred = await new Promise<boolean>(resolve => {
                setTimeout(() => resolve(bypass.isActive()), 0);
            });

            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(outside).toBe(false);
            expect(outsideDeferred).toBe(false);
            expect(bypass.isActive()).toBe(false);

            held.release();
            const result = await pending;

            expect(result.ok).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("awaits the update inside bypass.run: the tool does not answer before the write finished", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            const held = holdFakeEditorUpdate();
            let answered = false;

            const pending = tool.execute({ fields: { title: "New" } }, toolContext).then(result => {
                answered = true;
                return result;
            });
            await held.started;
            await new Promise<void>(resolve => {
                setTimeout(resolve, 0);
            });

            expect(answered).toBe(false);
            expect(fakeEditor.updateCalls[0].finished).toBe(false);

            held.release();
            const result = await pending;

            expect(answered).toBe(true);
            expect(fakeEditor.updateCalls[0].finished).toBe(true);
            expect(fakeEditor.updateCalls[0].bypassActiveAfterAwait).toBe(true);
            expect(result).toEqual({ ok: true, data: { applied: ["title"] } });
        });
    });
});
