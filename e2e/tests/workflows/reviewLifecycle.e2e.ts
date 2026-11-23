import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "../../support/apiSession.ts";
import type { ApiSession } from "../../support/apiSession.ts";
import { createTestModel, deleteTestModel } from "../../support/contentModel.ts";
import type { TestModel } from "../../support/contentModel.ts";
import { createDraftEntry, deleteEntryPermanently, getEntryStatus } from "../../support/entry.ts";
import type { TestEntry } from "../../support/entry.ts";
import { openEntryForm, reviewBar } from "./support/entryForm.ts";
import { acceptEntryFormLeavePrompt } from "../../support/leavePrompt.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "../../support/pageErrors.ts";
import {
    approveStep,
    cancelReviewsForDelete,
    getTargetReview,
    requestReview,
    startStep
} from "./support/review.ts";
import { createReviewCast, deleteReviewCast } from "./support/reviewCast.ts";
import type { ReviewCast } from "./support/reviewCast.ts";
import { createReviewWorkflow } from "./support/reviewWorkflow.ts";
import type { ReviewWorkflow } from "./support/reviewWorkflow.ts";
import { signInAs } from "../../support/signIn.ts";
import { deleteTestWorkflow } from "./support/workflow.ts";
import { createRunId } from "../../support/createRunId.ts";

/*
 * One review from request to publish, driven in the entry form by the people it involves: the
 * author requests it, team A starts, takes over and approves step 1, team B approves step 2, team A
 * approves step 3, and the author publishes the approved entry. The API refuses what the bar does
 * not offer. The people, teams, model and workflow are the test's own, made through the API.
 *
 * `wcp`: workflows and teams only exist on a licensed project.
 */
describe(
    "a review runs from request to publish",
    { serial: true, session: "admin", tags: ["wcp", "workflows"] },
    () => {
        // Fresh per run, so earlier runs' data never matches.
        const runId = createRunId();
        const entryTitle = `E2E lifecycle ${runId}`;
        const approveComment = `Looks good to team A ${runId}`;
        let admin: ApiSession | null = null;
        let model: TestModel | null = null;
        let cast: ReviewCast | null = null;
        let workflow: ReviewWorkflow | null = null;
        let entry: TestEntry | null = null;
        let reviewId = "";

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
            await acceptEntryFormLeavePrompt(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        // Reviews cannot be deleted: the entry's review is cancelled so the entry can go.
        afterAll(async () => {
            if (!admin) {
                return;
            }
            const problems: (string | null)[] = [];
            if (model && entry) {
                problems.push(await cancelReviewsForDelete(admin, model, entry));
                problems.push(await deleteEntryPermanently(admin, model, entry));
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

        test("the author requests a review in the entry form", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            admin = await waitForApiSession(captured);
            model = await createTestModel(admin, runId);
            cast = await createReviewCast(admin, runId);
            workflow = await createReviewWorkflow(admin, model, cast, runId);
            entry = await createDraftEntry(admin, model, entryTitle);

            await signInAs({ app, screen, browser }, cast.author);
            await openEntryForm(app, model, entry);
            const bar = reviewBar(browser);
            await bar.getByRole("button", "Request review").tap();
            const dialog = screen.getByRole("dialog", "Request review");
            await expect(dialog.getByRole("heading", "Team A check")).toBeVisible();
            await dialog.getByRole("button", "Request review").tap();
            await expect(dialog).toBeHidden();

            await expect(bar.getByText("Step 1 of 3: Team A check")).toBeVisible();
            await expect(
                bar.getByText(`Waiting in the ${cast.teamA.name} team pool.`)
            ).toBeVisible();
            await expect(
                bar.getByText(
                    "Editing, publishing and moving are locked while this revision is in review."
                )
            ).toBeVisible();
            await expect(screen.getByRole("textbox", "Title")).toBeDisabled();

            const review = await getTargetReview(admin, model, entry);
            expect(review?.state).toBe("inProgress");
            reviewId = review!.id;
        });

        test("the author can neither request a second review nor start the step", async ({
            app,
            screen,
            browser
        }) => {
            const author = await signInAs({ app, screen, browser }, cast!.author);
            await openEntryForm(app, model!, entry!);
            const bar = reviewBar(browser);
            await expect(bar.getByText("Step 1 of 3: Team A check")).toBeVisible();
            await expect(bar.getByRole("button", "Request review")).toBeHidden();
            await expect(bar.getByRole("button", "Start")).toBeHidden();

            const second = await requestReview(author, model!, entry!, entryTitle);
            expect(second.errorCode).toBe("Workflows/Review/AlreadyActive");
            const start = await startStep(author, { reviewId, stepId: workflow!.first.id });
            expect(start.errorCode).toBe("Workflows/Review/RequesterCannotReview");
        });

        test("a reviewer outside team A cannot start step 1", async ({ app, screen, browser }) => {
            const reviewerB = await signInAs({ app, screen, browser }, cast!.reviewerB);
            await openEntryForm(app, model!, entry!);
            const bar = reviewBar(browser);
            await expect(bar.getByText("Step 1 of 3: Team A check")).toBeVisible();
            await expect(bar.getByRole("button", "Start")).toBeHidden();

            const start = await startStep(reviewerB, { reviewId, stepId: workflow!.first.id });
            expect(start.errorCode).toBe("Workflows/Review/NotCandidate");
        });

        test("a team A reviewer starts step 1 and owns it", async ({ app, screen, browser }) => {
            await signInAs({ app, screen, browser }, cast!.reviewerA1);
            await openEntryForm(app, model!, entry!);
            const bar = reviewBar(browser);
            await bar.getByRole("button", "Start").tap();
            const dialog = screen.getByRole("dialog", "Start “Team A check”?");
            await dialog.getByRole("button", "Start").tap();
            await expect(dialog).toBeHidden();

            await expect(bar.getByText("You are reviewing this step.")).toBeVisible();
            await expect(bar.getByRole("button", "Approve")).toBeVisible();
            const review = await getTargetReview(admin!, model!, entry!);
            expect(review?.currentOwnerId).toBe(cast!.reviewerA1.id);
        });

        test("the other team A reviewer cannot approve, takes over and approves", async ({
            app,
            screen,
            browser
        }) => {
            const reviewerA2 = await signInAs({ app, screen, browser }, cast!.reviewerA2);
            const approve = await approveStep(reviewerA2, {
                reviewId,
                stepId: workflow!.first.id
            });
            expect(approve.errorCode).toBe("Workflows/Review/NotOwner");

            await openEntryForm(app, model!, entry!);
            const bar = reviewBar(browser);
            await expect(bar.getByText(`Owner: ${cast!.reviewerA1.displayName}`)).toBeVisible();
            await expect(bar.getByRole("button", "Approve")).toBeHidden();
            await bar.getByRole("button", "Take over").tap();
            const takeOver = screen.getByRole("dialog", "Take over this step?");
            await takeOver.getByRole("button", "Take over").tap();
            await expect(takeOver).toBeHidden();
            await expect(bar.getByText("You are reviewing this step.")).toBeVisible();

            await bar.getByRole("button", "Approve").tap();
            const dialog = screen.getByRole("dialog", "Approve “Team A check”?");
            await dialog.getByRole("textbox").fill(approveComment);
            await dialog.getByRole("button", "Approve").tap();
            await expect(dialog).toBeHidden();

            await expect(bar.getByText("Step 2 of 3: Team B check")).toBeVisible();
        });

        test("the team B reviewer starts and approves step 2", async ({ app, screen, browser }) => {
            await signInAs({ app, screen, browser }, cast!.reviewerB);
            await openEntryForm(app, model!, entry!);
            const bar = reviewBar(browser);
            await bar.getByRole("button", "Start").tap();
            const start = screen.getByRole("dialog", "Start “Team B check”?");
            await start.getByRole("button", "Start").tap();
            await expect(start).toBeHidden();

            await bar.getByRole("button", "Approve").tap();
            const approve = screen.getByRole("dialog", "Approve “Team B check”?");
            await approve.getByRole("button", "Approve").tap();
            await expect(approve).toBeHidden();

            await expect(bar.getByText("Step 3 of 3: Team A sign-off")).toBeVisible();
        });

        test("team A approves step 3 and nothing is published on its own", async ({
            app,
            screen,
            browser
        }) => {
            await signInAs({ app, screen, browser }, cast!.reviewerA1);
            await openEntryForm(app, model!, entry!);
            const bar = reviewBar(browser);
            await bar.getByRole("button", "Start").tap();
            const start = screen.getByRole("dialog", "Start “Team A sign-off”?");
            await start.getByRole("button", "Start").tap();
            await expect(start).toBeHidden();

            await bar.getByRole("button", "Approve").tap();
            const approve = screen.getByRole("dialog", "Approve “Team A sign-off”?");
            await approve.getByRole("button", "Approve").tap();
            await expect(approve).toBeHidden();

            await expect(bar.getByText("Every step approved. Ready to publish.")).toBeVisible();
            const review = await getTargetReview(admin!, model!, entry!);
            expect(review?.state).toBe("approved");
            expect(await getEntryStatus(admin!, model!, entry!)).toBe("draft");
        });

        test("the author publishes the approved entry from the form", async ({
            app,
            screen,
            browser
        }) => {
            await signInAs({ app, screen, browser }, cast!.author);
            await openEntryForm(app, model!, entry!);
            const bar = reviewBar(browser);
            await expect(bar.getByText("Every step approved. Ready to publish.")).toBeVisible();

            await screen.getByRole("button", "Save & Publish").tap();
            const confirm = screen.getByRole("dialog", "Publish entry");
            await confirm.getByRole("button", "Yes, publish!").tap();
            await expect(confirm).toBeHidden();

            await expect(bar.getByText("Approved and published")).toBeVisible();
            expect(await getEntryStatus(admin!, model!, entry!)).toBe("published");
        });

        test("the review details show the comment and the three approved steps", async ({
            screen,
            browser
        }) => {
            await reviewBar(browser).getByRole("button", "Review details").tap();
            const drawer = screen.getByRole("dialog", `Review details ${entryTitle} Approved`);
            await expect(drawer).toBeVisible();

            for (const step of [workflow!.first, workflow!.second, workflow!.third]) {
                const item = screen.getByTestId(`review-step-${step.id}`);
                await expect(item.getByText(step.title)).toBeVisible();
                await expect(item.getByText("Approved")).toBeVisible();
            }
            const first = screen.getByTestId(`review-step-${workflow!.first.id}`);
            await first.getByText(workflow!.first.title).tap();
            // The comment is quoted after the name of who approved: the reviewer who took over.
            await expect(
                first.getByText(`${cast!.reviewerA2.displayName}: “${approveComment}”`)
            ).toBeVisible();
        });
    }
);
