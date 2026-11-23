import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "../../../support/apiSession.ts";
import type { ApiSession } from "../../../support/apiSession.ts";
import { createTestModel, deleteTestModel } from "../../../support/contentModel.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import { createDraftEntry, deleteEntryPermanently } from "../../../support/entry.ts";
import type { TestEntry } from "../../../support/entry.ts";
import { createRunId } from "../../../support/createRunId.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "../../../support/pageErrors.ts";
import { CMS_ENTRIES_MODEL } from "../support/cmsModel.ts";
import { entryRow, openEntryList } from "../support/entryList.ts";
import { readEntryRecord } from "../support/entryRecord.ts";

/*
 * Two drafts picked by their checkboxes are published together through the list's bulk Publish,
 * and a third, not picked, stays a draft.
 *
 * No licence tag: bulk publishing a selection is base Headless CMS. (Selecting every entry of a
 * model runs as a background task instead; this test picks rows one by one.)
 */
describe(
    "two picked drafts are published in bulk",
    { serial: true, session: "admin", tags: ["cms", "cms-entries"] },
    () => {
        // Fresh per run, so earlier runs' models never match.
        const runId = createRunId();
        const firstTitle = `E2E bulk one ${runId}`;
        const secondTitle = `E2E bulk two ${runId}`;
        const otherTitle = `E2E bulk other ${runId}`;
        let session: ApiSession | null = null;
        let model: TestModel | null = null;
        const entries: TestEntry[] = [];

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        afterAll(async () => {
            if (!session || !model) {
                return;
            }
            const problems: (string | null)[] = [];
            for (const entry of entries) {
                problems.push(await deleteEntryPermanently(session, model, entry));
            }
            problems.push(await deleteTestModel(session, model));
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("picking two rows offers the bulk actions", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            session = await waitForApiSession(captured);
            model = await createTestModel(session, runId, CMS_ENTRIES_MODEL);
            for (const title of [firstTitle, secondTitle, otherTitle]) {
                entries.push(await createDraftEntry(session, model, title, { price: 1 }));
            }
            await openEntryList(app, screen, model);
            await entryRow(screen, otherTitle).waitFor();

            await entryRow(screen, firstTitle).getByRole("checkbox", "Select row").check();
            await entryRow(screen, secondTitle).getByRole("checkbox", "Select row").check();

            await expect(screen.getByText("2 entries selected")).toBeVisible();
            await expect(screen.getByRole("button", "Publish", { exact: true })).toBeVisible();
            await expect(
                entryRow(screen, otherTitle).getByRole("checkbox", "Select row")
            ).not.toBeChecked();
        });

        test("bulk Publish asks first, then publishes both", async ({ screen }) => {
            await screen.getByRole("button", "Publish", { exact: true }).tap();
            const confirm = screen.getByRole("dialog", "Publish entries");
            await expect(
                confirm.getByText("You are about to publish 2 entries.", { exact: false })
            ).toBeVisible();
            await confirm.getByRole("button").last().tap();

            await expect(
                screen.getByText("Finished publishing entries! See full report below:")
            ).toBeVisible();
            for (const entry of entries.slice(0, 2)) {
                expect((await readEntryRecord(session!, model!, entry.entryId))?.status).toBe(
                    "published"
                );
            }
            expect((await readEntryRecord(session!, model!, entries[2].entryId))?.status).toBe(
                "draft"
            );
        });

        test("the list shows both as published", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);

            await expect(
                entryRow(screen, firstTitle).getByRole("cell", "Published (v1)")
            ).toBeVisible();
            await expect(
                entryRow(screen, secondTitle).getByRole("cell", "Published (v1)")
            ).toBeVisible();
            await expect(
                entryRow(screen, otherTitle).getByRole("cell", "Draft (v1)")
            ).toBeVisible();
        });
    }
);
