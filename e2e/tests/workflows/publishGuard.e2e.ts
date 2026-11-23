import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "../../support/apiSession.ts";
import type { ApiSession } from "../../support/apiSession.ts";
import { createTestModel, deleteTestModel } from "../../support/contentModel.ts";
import type { TestModel } from "../../support/contentModel.ts";
import { createDraftEntry, deleteEntryPermanently } from "../../support/entry.ts";
import type { TestEntry } from "../../support/entry.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "../../support/pageErrors.ts";
import { publishEntry, schedulePublish } from "./support/publishAttempts.ts";
import { createTestTeam, deleteTestTeam } from "../../support/team.ts";
import type { TestTeam } from "../../support/team.ts";
import { createTestWorkflow, deleteTestWorkflow } from "./support/workflow.ts";
import { createRunId } from "../../support/createRunId.ts";

const PUBLISH_BLOCKED = "Workflows/Review/PublishBlocked";

/*
 * A draft of a model bound to a workflow cannot be published without an approved review: the entry
 * form asks for a review instead, and the API refuses both an immediate and a scheduled publish.
 *
 * `wcp`: workflows only exist on a licensed project.
 */
describe(
    "a draft under a workflow is not published without a review",
    { serial: true, session: "admin", tags: ["wcp", "workflows"] },
    () => {
        // Fresh per run, so earlier runs' models and teams never match.
        const runId = createRunId();
        let session: ApiSession | null = null;
        let model: TestModel | null = null;
        let team: TestTeam | null = null;
        let workflowId: string | null = null;
        let entry: TestEntry | null = null;

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        // The workflow goes first, then the entry, so the model can be deleted.
        afterAll(async () => {
            if (!session) {
                return;
            }
            const problems: (string | null)[] = [];
            if (workflowId) {
                problems.push(await deleteTestWorkflow(session, workflowId));
            }
            if (model && entry) {
                problems.push(await deleteEntryPermanently(session, model, entry));
            }
            if (model) {
                problems.push(await deleteTestModel(session, model));
            }
            if (team) {
                problems.push(await deleteTestTeam(session, team));
            }
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("the entry form asks for a review instead of publishing", async ({
            app,
            screen,
            browser
        }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            session = await waitForApiSession(captured);
            model = await createTestModel(session, runId);
            team = await createTestTeam(session, runId);
            workflowId = await createTestWorkflow(session, model, team, runId);
            entry = await createDraftEntry(session, model, `E2E draft ${runId}`);

            await app.open(
                `/cms/content-entries/${model.modelId}?id=${encodeURIComponent(entry.id)}`
            );

            await expect(
                screen.getByText("This content needs a review before it can be published.")
            ).toBeVisible();
            await expect(screen.getByRole("button", "Request review")).toBeVisible();
            await expect(screen.getByRole("button", "Publish")).toBeDisabled();
        });

        test("publishing the draft through the API is refused", async () => {
            const attempt = await publishEntry(session!, model!, entry!);

            expect(attempt.errorCode).toBe(PUBLISH_BLOCKED);
        });

        test("scheduling the draft's publish through the API is refused", async () => {
            const attempt = await schedulePublish(session!, model!, entry!);

            expect(attempt.errorCode).toBe(PUBLISH_BLOCKED);
        });
    }
);
