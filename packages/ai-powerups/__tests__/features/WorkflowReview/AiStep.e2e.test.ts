import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Actor, ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { Review } from "@webiny/api-workflows/domain/review/Review.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "@webiny/api-workflows/features/review/ReviewSaver/abstractions.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { WorkflowStepRunTaskHandler } from "@webiny/api-workflows/features/stepRun/WorkflowStepRunTask/index.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { STEP_RUN_STALE_CHECK_INTERVAL_MS } from "@webiny/api-workflows/features/stepRun/constants.js";
import type { StepRunTaskInput } from "@webiny/api-workflows/features/stepRun/types.js";
import { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";
import { ListWorkflowStepTypesUseCase } from "@webiny/api-workflows/features/config/ListWorkflowStepTypes/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_STEP_MAX_INPUT_CHARACTERS,
    AI_TOOL_STEP_NOT_RUNNING_MESSAGE,
    READ_TARGET_TOOL_NAME,
    UPDATE_TARGET_FIELDS_TOOL_NAME
} from "@webiny/api-workflows/features/aiTools/constants.js";
import type { ReviewTargetContent } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WORKFLOWS_REVIEW_CAPABILITY_ID } from "~/api/features/WorkflowReview/constants.js";
import { AI_MODEL, AI_STEP_ID } from "~tests/__helpers/aiStepFixtures.js";
import type { ScriptedStep } from "~tests/__helpers/ScriptedAi.js";
import { AUTHOR_NAMESPACE } from "~tests/__helpers/AuthorModel.js";
import {
    createAuthorEntry,
    expectOk,
    getAuthorModel,
    getErrorCode,
    readEntry
} from "~tests/__helpers/AuthorEntries.js";
import { abortedTasks, resetFakeTasks, triggeredTasks } from "~tests/__helpers/FakeTaskService.js";
import { createFakeTaskController } from "~tests/__helpers/FakeTaskController.js";
import type { FakeTaskControllerParams } from "~tests/__helpers/FakeTaskController.js";
import { loggedErrors, loggedInfos } from "~tests/__helpers/CapturingLogger.js";
import { bypassProbe, resetBypassProbe } from "~tests/__helpers/ProbeUpdateEntry.js";
import { hiddenAiTools } from "~tests/__helpers/HiddenAiToolRegistry.js";
import {
    ANTHROPIC_CONNECTION,
    OTHER_IDENTITY,
    REQUESTER_IDENTITY,
    createAiStepContext
} from "~tests/__helpers/createAiStepContext.js";

/** The identity of the request (`REQUESTER_IDENTITY`), as the requester of every review here. */
const ADMIN: Actor = {
    type: "user",
    id: REQUESTER_IDENTITY.id,
    displayName: REQUESTER_IDENTITY.displayName,
    identityType: "admin"
};

/** The `data` of a `readTarget` tool result. */
interface ReadTargetToolResult {
    ok: boolean;
    data: ReviewTargetContent;
}

const BIO = "Writes about cats.";
const EDITED_BIO = "Writes about cats and dogs.";

const DEFINITION: TaskDefinition.Metadata = {
    id: "workflowsStepRun",
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: 10000
};

const createAiWorkflowValues = (
    tools: string[] = [READ_TARGET_TOOL_NAME, UPDATE_TARGET_FIELDS_TOOL_NAME]
): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "AI review",
        models: [AUTHOR_NAMESPACE],
        steps: [
            {
                id: AI_STEP_ID,
                title: "AI review",
                description: "The AI checks the profile.",
                color: "blue",
                type: "ai",
                notifications: [],
                config: {
                    instructions: "Fix typos in the bio and approve a friendly profile.",
                    model: AI_MODEL,
                    tools
                }
            }
        ]
    };
};

interface SetupParams {
    bio?: string;
    /** The tool allowlist of the AI step; both built-in tools by default. */
    tools?: string[];
}

/** A text of `length` characters that is spaced like prose (no single unbroken run). */
const createSpacedText = (length: number): string => {
    return "word ".repeat(Math.ceil(length / 5)).slice(0, length);
};

/** A stored AI workflow, an author entry and a review requested through the engine. */
const setup = async (params: SetupParams = {}) => {
    const env = await createAiStepContext();
    const { context } = env;
    expectOk(
        await context.container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createAiWorkflowValues(params.tools), actor: ADMIN })
    );
    const entry = await createAuthorEntry(context, { name: "Ann", bio: params.bio ?? BIO });
    const review = expectOk(
        await context.container.resolve(RequestReviewUseCase).execute({
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            actor: ADMIN
        })
    );

    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);
    const identityContext = context.container.resolve(IdentityContext);
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const input: StepRunTaskInput = { reviewId: review.id, stepId: AI_STEP_ID };

    return {
        ...env,
        entry,
        review,
        /** The id of the task the reach triggered for the AI step. */
        taskId: triggeredTasks[0]?.id as string,
        readReview: async (): Promise<ReviewData> => expectOk(await repository.get(review.id)),
        readStoredEntry: () => readEntry(context, entry.id),
        /** Fails the step as a hook or stuck detection would, through the saver. */
        failStoredStep: async (reason: string): Promise<void> => {
            const stored = Review.fromData(expectOk(await repository.get(review.id)));
            expectOk(stored.fail({ stepId: AI_STEP_ID, reason, now: new Date().toISOString() }));
            expectOk(await saver.save(stored));
        },
        cancel: async (): Promise<void> => {
            expectOk(
                await context.container
                    .resolve(CancelReviewUseCase)
                    .execute({ reviewId: review.id, actor: ADMIN })
            );
        },
        restart: async (): Promise<ReviewData> => {
            return expectOk(
                await context.container
                    .resolve(RestartReviewStepUseCase)
                    .execute({ reviewId: review.id, stepId: AI_STEP_ID, actor: ADMIN })
            );
        },
        /**
         * Runs the real handler for `taskId` as a task runner would: authorization off (R161).
         * `ambientIdentity` is the identity in force around the run (a task runner is not the
         * requester); the handler must switch to the requester itself.
         */
        run: (
            taskId: string,
            controllerParams: Partial<FakeTaskControllerParams> = {},
            ambientIdentity?: IdentityData
        ) => {
            const { controller, task, outputUpdates } = createFakeTaskController({
                taskId,
                createdById: ADMIN.id,
                input,
                ...controllerParams
            });
            const runHandler = () => {
                return identityContext.withoutAuthorization(() => {
                    return handler.run({ input: task.input, controller, definition: DEFINITION });
                });
            };
            return {
                outputUpdates,
                result: ambientIdentity
                    ? identityContext.withIdentity(
                          new AuthenticatedIdentity(ambientIdentity),
                          runHandler
                      )
                    : runHandler()
            };
        }
    };
};

const readAndEdit = (bio: string): ScriptedStep[] => {
    return [
        { toolCalls: [{ name: READ_TARGET_TOOL_NAME, input: {} }] },
        { toolCalls: [{ name: UPDATE_TARGET_FIELDS_TOOL_NAME, input: { fields: { bio } } }] }
    ];
};

beforeEach(() => {
    resetFakeTasks();
    resetBypassProbe();
    hiddenAiTools.clear();
    loggedErrors.length = 0;
    loggedInfos.length = 0;
});

afterEach(() => {
    vi.useRealTimers();
});

describe("AI step end to end: a CMS review through the real handler and tools", () => {
    describe("registration (R166, R177, R178)", () => {
        it("registers the ai step type and the ai runner, and lists the ai row from the registry", async () => {
            const { context } = await setup();

            expect(context.container.resolveAll(StepType).map(type => type.type)).toContain("ai");
            expect(context.container.resolveAll(StepRunner).map(runner => runner.type)).toContain(
                "ai"
            );
            const rows = expectOk(
                await context.container.resolve(ListWorkflowStepTypesUseCase).execute()
            );
            const ai = rows.find(row => row.type === "ai");
            expect(ai).toMatchObject({ type: "ai", available: true, unavailableReason: null });
            expect(ai?.configSchema).toMatchObject({
                properties: { instructions: { ui: "textarea" } }
            });
        });

        it("reached the step by triggering the task as the requester (R149, R161)", async () => {
            const { review } = await setup();

            expect(triggeredTasks).toHaveLength(1);
            expect(triggeredTasks[0]).toMatchObject({
                definition: "workflowsStepRun",
                input: { reviewId: review.id, stepId: AI_STEP_ID },
                identityId: ADMIN.id
            });
            expect(review).toMatchObject({ currentStepState: "inReview", currentStepType: "ai" });
            expect(review.steps[0]).toMatchObject({
                state: "inReview",
                taskId: triggeredTasks[0].id,
                owner: { type: "ai", id: ADMIN.id, displayName: ADMIN.displayName }
            });
        });
    });

    describe("decisions (R171)", () => {
        it("approves: the review is approved as the AI actor and the entry is untouched", async () => {
            const { run, taskId, ai, readReview, readStoredEntry, entry } = await setup();
            ai.response = {
                steps: [],
                decision: { approved: true, comment: "A friendly profile.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await readReview();
            expect(stored).toMatchObject({ state: "approved", currentStepState: "approved" });
            expect(stored.steps[0]).toMatchObject({
                state: "approved",
                comment: "A friendly profile.",
                issues: [],
                owner: { type: "ai", id: ADMIN.id },
                taskId
            });
            expect(ai.calls).toHaveLength(1);
            expect(ai.calls[0].model).toBe(AI_MODEL);
            expect(String(ai.calls[0].prompt)).toContain("Fix typos in the bio");
            expect(String(ai.calls[0].prompt)).toContain(BIO);
            const storedEntry = await readStoredEntry();
            expect(storedEntry.id).toBe(entry.id);
            expect(storedEntry.values.bio).toBe(BIO);
            expect(loggedErrors).toEqual([]);
        });

        it("rejects with the comment and stores the issues on the step", async () => {
            const { run, taskId, ai, readReview, readStoredEntry } = await setup();
            ai.response = {
                steps: [],
                decision: {
                    approved: false,
                    comment: "The bio is not about the author.",
                    issues: [
                        {
                            fieldPath: "bio",
                            severity: "error",
                            message: "Talks about cats only.",
                            suggestion: "Write about the author."
                        }
                    ]
                }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await readReview();
            expect(stored.state).toBe("rejected");
            expect(stored.steps[0]).toMatchObject({
                state: "rejected",
                comment: "The bio is not about the author.",
                owner: { type: "ai", id: ADMIN.id },
                issues: [
                    {
                        fieldPath: "bio",
                        severity: "error",
                        message: "Talks about cats only.",
                        suggestion: "Write about the author."
                    }
                ]
            });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
        });

        it("fails the step when a rejection has no comment (D100)", async () => {
            const { run, taskId, ai, readReview } = await setup();
            ai.response = { steps: [], decision: { approved: false, comment: "no", issues: [] } };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await readReview();
            expect(stored.state).toBe("inProgress");
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review rejected without a comment."
            });
        });
    });

    describe("tools and the write (R172, R173, D36, D62, Review Focus 4)", () => {
        it("reads the target, edits a field through the CMS update path and approves", async () => {
            const { run, taskId, ai, readReview, readStoredEntry, entry, context } = await setup();
            ai.response = {
                steps: readAndEdit(EDITED_BIO),
                decision: { approved: true, comment: "Fixed the bio.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            // readTarget answered the content with the writable flags.
            expect(ai.toolResults[0]).toMatchObject({ name: READ_TARGET_TOOL_NAME });
            const content = (ai.toolResults[0].result as ReadTargetToolResult).data;
            expect(content.fields.find(field => field.path === "bio")).toMatchObject({
                value: BIO,
                writable: true
            });
            // updateTargetFields wrote exactly that field, on the reviewed revision (A57).
            expect(ai.toolResults[1].result).toEqual({ ok: true, data: { applied: ["bio"] } });
            const stored = await readStoredEntry();
            expect(stored.id).toBe(entry.id);
            expect(stored.values).toMatchObject({ name: "Ann", bio: EDITED_BIO });
            expect((await readReview()).state).toBe("approved");
            // The bypass was open only around the write: it is closed now, and the approved
            // revision is locked against everyone else (D80).
            expect(context.container.resolve(WorkflowBypassService).isActive()).toBe(false);
            const model = await getAuthorModel(context);
            const blocked = await context.container
                .resolve(UpdateEntryUseCase)
                .execute(model, entry.id, { values: { bio: "Edited by someone else." } });
            expect(blocked.isFail()).toBe(true);
            expect(getErrorCode(blocked)).toBe("Workflows/Review/TargetLocked");
            expect(loggedErrors).toEqual([]);
        });

        it("refuses an unknown path and writes nothing, atomically; the step still decides", async () => {
            const { run, taskId, ai, readReview, readStoredEntry } = await setup();
            ai.response = {
                steps: [
                    {
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: "New bio.", entryId: "forged" } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(ai.toolResults[0].result).toMatchObject({ ok: false });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            expect((await readReview()).state).toBe("approved");
        });

        it("refuses trash, permanent delete and move from inside the bypass window while the update succeeds", async () => {
            const { run, taskId, ai, readStoredEntry } = await setup();
            bypassProbe.enabled = true;
            ai.response = {
                steps: readAndEdit(EDITED_BIO),
                decision: { approved: true, comment: "Fixed the bio.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            // One update ran inside the tool's bypass window. The attempts it made were refused
            // with the exact codes: the bypass exempts the save block and nothing else (D134, R150).
            expect(bypassProbe.results).toHaveLength(1);
            expect(bypassProbe.results[0]).toMatchObject({
                trashRefusedWith: "Workflows/Review/ActiveReviewOnTrash",
                permanentDeleteRefusedWith: "Workflows/Review/ActiveReviewOnTrash",
                moveRefusedWith: "Workflows/Review/TargetLocked"
            });
            const stored = await readStoredEntry();
            expect(stored.values.bio).toBe(EDITED_BIO);
            // Not moved and not in the bin.
            expect(stored.location?.folderId).toBe("root");
            expect(stored.deletedOn).toBeNull();
        });

        it("writes as the requester even when the handler runs under another identity (R161, Review Focus 4)", async () => {
            const { run, taskId, ai, readStoredEntry } = await setup();
            bypassProbe.enabled = true;
            ai.response = {
                steps: readAndEdit(EDITED_BIO),
                decision: { approved: true, comment: "Fixed the bio.", issues: [] }
            };
            expect(OTHER_IDENTITY.id).not.toBe(ADMIN.id);

            // The ambient identity of the run is not the requester; the handler switches to it.
            const { result } = run(taskId, {}, OTHER_IDENTITY);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(bypassProbe.results).toHaveLength(1);
            expect(bypassProbe.results[0].identityId).toBe(ADMIN.id);
            const stored = await readStoredEntry();
            expect(stored.values.bio).toBe(EDITED_BIO);
            expect(stored.savedBy.id).toBe(ADMIN.id);
            expect(stored.modifiedBy?.id).toBe(ADMIN.id);
        });

        it("offers only the allowlisted tool: a call to updateTargetFields is not available and the entry is untouched", async () => {
            const { run, taskId, ai, readReview, readStoredEntry } = await setup({
                tools: [READ_TARGET_TOOL_NAME]
            });
            ai.response = {
                steps: [
                    {
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: EDITED_BIO } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(Object.keys(ai.calls[0].tools ?? {})).toEqual([READ_TARGET_TOOL_NAME]);
            expect(ai.toolResults[0].result).toMatchObject({ ok: false });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            expect((await readReview()).state).toBe("approved");
        });

        it("answers a bad value with a not-ok result, leaves the entry untouched and closes the bypass", async () => {
            const { run, taskId, ai, readStoredEntry, context } = await setup();
            ai.response = {
                steps: [
                    {
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: 42 } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(ai.toolResults[0].result).toMatchObject({ ok: false });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            expect(context.container.resolve(WorkflowBypassService).isActive()).toBe(false);
        });
    });

    describe("failures are fixed texts and the step is restartable (R170, D8)", () => {
        it("fails with the model text when the connection is gone, then restarts and approves", async () => {
            const { run, taskId, ai, presets, readReview, restart } = await setup();
            // The connection is removed after the review was requested.
            presets.splice(0, presets.length);

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const failed = await readReview();
            expect(failed.state).toBe("inProgress");
            expect(failed.steps[0]).toMatchObject({
                state: "failed",
                comment: `The model "${AI_MODEL}" is not available.`
            });
            expect(ai.calls).toHaveLength(0);
            expect(loggedErrors).toEqual([]);

            // The connection is back; the author restarts the failed step: a new task, a new run.
            presets.push(ANTHROPIC_CONNECTION);
            const restarted = await restart();
            const newTaskId = triggeredTasks[1].id;
            expect(newTaskId).not.toBe(taskId);
            expect(restarted.steps[0]).toMatchObject({ state: "inReview", taskId: newTaskId });
            expect(restarted.steps[0].runs).toHaveLength(1);
            expect(restarted.steps[0].runs[0]).toMatchObject({
                taskId,
                outcome: "failed",
                reason: `The model "${AI_MODEL}" is not available.`
            });
            ai.response = {
                steps: [],
                decision: { approved: true, comment: "Fine after the restart.", issues: [] }
            };

            await expect(run(newTaskId).result).resolves.toMatchObject({ status: "done" });

            const approved = await readReview();
            expect(approved.state).toBe("approved");
            expect(approved.steps[0]).toMatchObject({
                state: "approved",
                comment: "Fine after the restart.",
                taskId: newTaskId
            });
            expect(ai.calls).toHaveLength(1);
        });

        it("fails with the capability text when the capability was switched off", async () => {
            const { run, taskId, ai, capabilityItems, readReview } = await setup();
            capabilityItems[WORKFLOWS_REVIEW_CAPABILITY_ID] = { enabled: false };

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review capability is not available."
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("fails with the tool text when an allowlisted tool is no longer registered", async () => {
            const { run, taskId, ai, readReview } = await setup();
            hiddenAiTools.add(UPDATE_TARGET_FIELDS_TOOL_NAME);

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: `The AI tool "${UPDATE_TARGET_FIELDS_TOOL_NAME}" is not available.`
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("fails with the too-large text and sends nothing to the model (R175: no truncation)", async () => {
            // Spaced prose over the cap, so the entry is a normal one the CMS can store; the
            // size follows the constant and does not hard-code a number.
            const bio = createSpacedText(AI_STEP_MAX_INPUT_CHARACTERS + 5000);
            const { run, taskId, ai, readReview, readStoredEntry } = await setup({ bio });

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: AI_STEP_CONTENT_TOO_LARGE_MESSAGE
            });
            expect(ai.calls).toHaveLength(0);
            expect((await readStoredEntry()).values.bio).toBe(bio);
        });

        it("fails with the timeout text when the task has no runtime left for the call (R175)", async () => {
            const { run, taskId, ai, readReview } = await setup();

            // The handler keeps 30 seconds of margin: with 30 seconds left the signal fires at once.
            await expect(
                run(taskId, { remainingMilliseconds: 30000 }).result
            ).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review timed out."
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("fails a re-entered task (iteration 2) without a model call (R170)", async () => {
            const { run, taskId, ai, readReview } = await setup();

            // The first entry persisted `{ idWaits: 0 }`; a re-entered task reads it and is on its
            // second iteration.
            await expect(
                run(taskId, { iterations: 2, output: { idWaits: 0, state: null } }).result
            ).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review failed."
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("persists the output once the id wait is over, before the call (R170)", async () => {
            const { run, taskId, ai } = await setup();
            ai.response = { steps: [], decision: { approved: true, comment: "", issues: [] } };

            const { result, outputUpdates } = run(taskId);

            await result;
            expect(outputUpdates).toEqual([{ idWaits: 0, state: null }]);
        });
    });

    describe("a cancel or restart during the model call writes nothing (R175, A56, Review Focus 1)", () => {
        beforeEach(() => {
            // Only `Date` is faked: the runner reads `Date.now()` for its 5-second throttle. The
            // clock starts at the real time so storage clients see no skew.
            vi.useFakeTimers({ toFake: ["Date"], now: new Date() });
        });

        it("stops the call and writes nothing when the review is cancelled during the call", async () => {
            const { run, taskId, ai, cancel, readReview, readStoredEntry } = await setup();
            ai.response = {
                steps: [
                    { toolCalls: [{ name: READ_TARGET_TOOL_NAME, input: {} }] },
                    {
                        // The stored review is cancelled while the model works; the clock moves
                        // past the throttle so the next tool call looks again.
                        before: async () => {
                            await cancel();
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: "Late edit." } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "Approved after the cancel.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            // The late write was refused before it reached the tool, the call was stopped.
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
            expect(ai.calls).toHaveLength(1);
            // Nothing of the AI landed: the entry, and the review exactly as the cancel left it.
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            const stored = await readReview();
            expect(stored.state).toBe("cancelled");
            expect(stored.isActive).toBe(false);
            expect(stored.steps[0].comment).not.toBe("Approved after the cancel.");
            expect(stored.steps[0].state).not.toBe("approved");
            expect(abortedTasks.map(aborted => aborted.id)).toContain(taskId);
            expect(loggedInfos).toContain("Ignored a stale step run failure.");
            expect(loggedErrors).toEqual([]);
        });

        it("stops the call and writes nothing when the step is restarted under a new task during the call", async () => {
            const { run, taskId, ai, failStoredStep, restart, readReview, readStoredEntry } =
                await setup();
            ai.response = {
                steps: [
                    { toolCalls: [{ name: READ_TARGET_TOOL_NAME, input: {} }] },
                    {
                        // The step fails elsewhere and is restarted: it now belongs to task-2.
                        before: async () => {
                            await failStoredStep("The step failed elsewhere.");
                            await restart();
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: "Late edit." } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "Approved by the old task.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
            expect(ai.calls).toHaveLength(1);
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            // The stored review is what the restart left: the step in review under the new task,
            // the failed attempt in `runs`, nothing from the old task.
            const stored = await readReview();
            const newTaskId = triggeredTasks[1].id;
            expect(newTaskId).not.toBe(taskId);
            expect(stored.state).toBe("inProgress");
            expect(stored.steps[0]).toMatchObject({ state: "inReview", taskId: newTaskId });
            expect(stored.steps[0].runs).toHaveLength(1);
            expect(stored.steps[0].runs[0]).toMatchObject({
                taskId,
                outcome: "failed",
                reason: "The step failed elsewhere."
            });
            expect(stored.steps[0].comment).not.toBe("Approved by the old task.");
            expect(loggedInfos).toContain("Ignored a stale step run failure.");
            expect(loggedErrors).toEqual([]);
        });
    });
});
