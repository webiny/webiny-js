import type { App, Screen } from "e2e";
import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "./support/apiSession.ts";
import type { ApiSession } from "./support/apiSession.ts";
import { createTestModel, deleteTestModel } from "./support/contentModel.ts";
import type { TestModel } from "./support/contentModel.ts";
import { createDraftEntry, deleteEntryPermanently } from "./support/entry.ts";
import type { TestEntry } from "./support/entry.ts";
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

type ReviewListScopeLabel = "Assigned to me" | "Team pool" | "Team in review" | "Requested by me";

const NO_MATCH = "No reviews match these filters";

/** Opens the Headless CMS Content Reviews list afresh on `scope`, searched for `title`. */
const openReviewList = async (
    app: App,
    screen: Screen,
    scope: ReviewListScopeLabel,
    title: string
) => {
    await app.open("/cms/content-reviews");
    await screen.getByRole("radiogroup", "Whose reviews").getByRole("radio", scope).tap();
    await screen.getByPlaceholder("Search...").fill(title);
};

/*
 * The Headless CMS Content Reviews list shows each person the reviews that involve them: the author
 * their request, a team A member the awaiting step in the team pool and, once started, under
 * Assigned to me, the other team A member under Team in review, and the team B member none of it.
 * Shards share a database, so every check goes through the review's unique title.
 *
 * `wcp`: workflows and teams only exist on a licensed project.
 */
describe(
    "the Content Reviews list shows each person their reviews",
    { serial: true, session: "admin", tags: ["wcp", "workflows"] },
    () => {
        // Fresh per run, so earlier runs' data never matches.
        const runId = createRunId();
        const title = `E2E list ${runId}`;
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

        test("the author finds the request under Requested by me", async ({
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
            entry = await createDraftEntry(admin, model, title);

            const author = await signInAs({ app, screen, browser }, cast.author);
            const requested = await requestReview(author, model, entry, title);
            expect(requested.errorCode).toBeNull();
            reviewId = requested.review!.id;

            await openReviewList(app, screen, "Requested by me", title);
            await expect(screen.getByRole("link", title)).toBeVisible();
        });

        test("a team A member finds the awaiting step in the team pool", async ({
            app,
            screen,
            browser
        }) => {
            await signInAs({ app, screen, browser }, cast!.reviewerA1);

            await openReviewList(app, screen, "Team pool", title);
            await expect(screen.getByRole("link", title)).toBeVisible();
        });

        test("once started, the step is assigned to that member and leaves the pool", async ({
            app,
            screen,
            browser
        }) => {
            const reviewer = await signInAs({ app, screen, browser }, cast!.reviewerA1);
            const started = await startStep(reviewer, { reviewId, stepId: workflow!.first.id });
            expect(started.errorCode).toBeNull();

            await openReviewList(app, screen, "Assigned to me", title);
            await expect(screen.getByRole("link", title)).toBeVisible();
            await openReviewList(app, screen, "Team pool", title);
            await expect(screen.getByText(NO_MATCH)).toBeVisible();
            await expect(screen.getByRole("link", title)).toBeHidden();
        });

        test("the other team A member finds it under Team in review", async ({
            app,
            screen,
            browser
        }) => {
            await signInAs({ app, screen, browser }, cast!.reviewerA2);

            await openReviewList(app, screen, "Team in review", title);
            await expect(screen.getByRole("link", title)).toBeVisible();
        });

        test("the team B member finds it in none of his lists", async ({
            app,
            screen,
            browser
        }) => {
            await signInAs({ app, screen, browser }, cast!.reviewerB);

            const scopes: ReviewListScopeLabel[] = [
                "Assigned to me",
                "Team pool",
                "Team in review",
                "Requested by me"
            ];
            for (const scope of scopes) {
                // The no-match text shows once the search for the unique title has run.
                await openReviewList(app, screen, scope, title);
                await expect(screen.getByText(NO_MATCH)).toBeVisible();
                await expect(screen.getByRole("link", title)).toBeHidden();
            }
        });
    }
);
