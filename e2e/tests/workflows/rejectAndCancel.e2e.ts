import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "./support/apiSession.ts";
import type { ApiSession } from "./support/apiSession.ts";
import { createTestModel, deleteTestModel } from "./support/contentModel.ts";
import type { TestModel } from "./support/contentModel.ts";
import { createDraftEntry, deleteEntryPermanently } from "./support/entry.ts";
import type { TestEntry } from "./support/entry.ts";
import { openEntryForm, reviewBar } from "./support/entryForm.ts";
import { acceptEntryFormLeavePrompt } from "./support/leavePrompt.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "./support/pageErrors.ts";
import { cancelReviewsForDelete, requestReview, startStep } from "./support/review.ts";
import { createReviewCast, deleteReviewCast } from "./support/reviewCast.ts";
import type { ReviewCast } from "./support/reviewCast.ts";
import { createReviewWorkflow } from "./support/reviewWorkflow.ts";
import type { ReviewWorkflow } from "./support/reviewWorkflow.ts";
import { signInAs } from "./support/signIn.ts";
import { deleteTestWorkflow } from "./support/workflow.ts";
import { createRunId } from "./support/createRunId.ts";

const NO_REVIEW = "This content needs a review before it can be published.";

/*
 * A review ends early in the entry form: a reviewer rejects it with a reason, which locks the
 * revision for good, and the author cancels another one, which unlocks the form for a new request.
 * Each review is requested and started through the API; the reject and the cancel are the UI's.
 *
 * `wcp`: workflows and teams only exist on a licensed project.
 */
describe(
    "a review is rejected or cancelled in the entry form",
    { serial: true, session: "admin", tags: ["wcp", "workflows"] },
    () => {
        // Fresh per run, so earlier runs' data never matches.
        const runId = createRunId();
        const rejectReason = `Needs a source for every claim ${runId}`;
        let admin: ApiSession | null = null;
        let model: TestModel | null = null;
        let cast: ReviewCast | null = null;
        let workflow: ReviewWorkflow | null = null;
        let rejected: TestEntry | null = null;
        let cancelled: TestEntry | null = null;

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
            await acceptEntryFormLeavePrompt(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        // Reviews cannot be deleted: the entries' reviews are cancelled so the entries can go.
        afterAll(async () => {
            if (!admin) {
                return;
            }
            const problems: (string | null)[] = [];
            if (model && rejected) {
                problems.push(await cancelReviewsForDelete(admin, model, rejected));
                problems.push(await deleteEntryPermanently(admin, model, rejected));
            }
            if (model && cancelled) {
                problems.push(await cancelReviewsForDelete(admin, model, cancelled));
                problems.push(await deleteEntryPermanently(admin, model, cancelled));
            }
            if (workflow) {
                problems.push(await deleteTestWorkflow(admin, workflow.id));
            }
            if (model) {
                problems.push(await deleteTestModel(admin, model));
            }
            if (cast) {
                problems.push(...(await deleteReviewCast(admin, cast)));
            }
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("a reviewer rejects only with a reason of 10 characters or more", async ({
            app,
            screen,
            browser
        }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            admin = await waitForApiSession(captured);
            model = await createTestModel(admin, runId);
            cast = await createReviewCast(admin, runId);
            workflow = await createReviewWorkflow(admin, model, cast, runId);
            rejected = await createDraftEntry(admin, model, `E2E rejected ${runId}`);
            cancelled = await createDraftEntry(admin, model, `E2E cancelled ${runId}`);

            const author = await signInAs({ app, screen, browser }, cast.author);
            const requested = await requestReview(author, model, rejected, `E2E rejected ${runId}`);
            expect(requested.errorCode).toBeNull();
            const reviewer = await signInAs({ app, screen, browser }, cast.reviewerA1);
            const started = await startStep(reviewer, {
                reviewId: requested.review!.id,
                stepId: workflow.first.id
            });
            expect(started.errorCode).toBeNull();

            await openEntryForm(app, model, rejected);
            const bar = reviewBar(browser);
            await bar.getByRole("button", "Reject").tap();
            const dialog = screen.getByRole("dialog", "Reject “Team A check”?");
            const reason = dialog.getByRole("textbox");
            const reject = dialog.getByRole("button", "Reject");
            await expect(reject).toBeDisabled();
            await reason.fill("Too vague");
            await expect(dialog.getByText("Use at least 10 characters.")).toBeVisible();
            await expect(reject).toBeDisabled();

            await reason.fill(rejectReason);
            await expect(reject).toBeEnabled();
            await reject.tap();
            await expect(dialog).toBeHidden();

            await expect(
                bar.getByText(`Rejected at Team A check: “${rejectReason}”`)
            ).toBeVisible();
        });

        test("the author sees the rejection and cannot request again", async ({
            app,
            screen,
            browser
        }) => {
            const author = await signInAs({ app, screen, browser }, cast!.author);
            await openEntryForm(app, model!, rejected!);
            const bar = reviewBar(browser);

            await expect(
                bar.getByText(`Rejected at Team A check: “${rejectReason}”`)
            ).toBeVisible();
            await expect(
                bar.getByText(
                    "This revision is locked. Create a new revision to fix it, then request a new review."
                )
            ).toBeVisible();
            await expect(bar.getByRole("button", "Request review")).toBeHidden();
            await expect(screen.getByRole("textbox", "Title")).toBeDisabled();

            const again = await requestReview(author, model!, rejected!, `E2E again ${runId}`);
            expect(again.errorCode).toBe("Workflows/Review/AlreadyActive");
        });

        test("the author cancels a review and the form is editable again", async ({
            app,
            screen,
            browser
        }) => {
            const author = await signInAs({ app, screen, browser }, cast!.author);
            const requested = await requestReview(
                author,
                model!,
                cancelled!,
                `E2E cancelled ${runId}`
            );
            expect(requested.errorCode).toBeNull();

            await openEntryForm(app, model!, cancelled!);
            const bar = reviewBar(browser);
            await expect(bar.getByText("Step 1 of 3: Team A check")).toBeVisible();
            await expect(screen.getByRole("textbox", "Title")).toBeDisabled();

            await bar.getByRole("button", "More review actions").tap();
            await screen.getByRole("menuitem", "Cancel review").tap();
            const dialog = screen.getByRole("dialog", "Cancel this review?");
            await dialog.getByRole("button", "Cancel review").tap();
            await expect(dialog).toBeHidden();

            await expect(bar.getByText(NO_REVIEW)).toBeVisible();
            await expect(screen.getByRole("textbox", "Title")).toBeEnabled();
        });

        test("a new review of the cancelled revision is accepted", async ({ screen, browser }) => {
            const bar = reviewBar(browser);
            await bar.getByRole("button", "Request review").tap();
            const dialog = screen.getByRole("dialog", "Request review");
            await dialog.getByRole("button", "Request review").tap();
            await expect(dialog).toBeHidden();

            await expect(bar.getByText("Step 1 of 3: Team A check")).toBeVisible();
            await expect(screen.getByRole("textbox", "Title")).toBeDisabled();
        });
    }
);
