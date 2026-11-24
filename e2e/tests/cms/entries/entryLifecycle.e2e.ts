import type { Screen } from "e2e";
import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "../../../support/apiSession.ts";
import type { ApiSession } from "../../../support/apiSession.ts";
import { createTestModel, deleteTestModel } from "../../../support/contentModel.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import { deleteEntryPermanently } from "../../../support/entry.ts";
import { createRunId } from "../../../support/createRunId.ts";
import { acceptEntryFormLeavePrompt } from "../../../support/leavePrompt.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "../../../support/pageErrors.ts";
import { CMS_ENTRIES_MODEL } from "../support/cmsModel.ts";
import { entryRow, openEntryList, pickMenuItem } from "../support/entryList.ts";
import { readEntryRecord } from "../support/entryRecord.ts";
import { listEntryRevisions } from "../support/entryRevisions.ts";

/** Opens the open entry's revisions drawer through the form's options menu. */
const openRevisionsDrawer = async (screen: Screen) => {
    await screen.getByTestId("cms.content-form.header.more-options").tap();
    await pickMenuItem(screen, "Show entry revisions");
    await screen.getByRole("dialog", "Entry revisions").waitFor();
};

/**
 * The revisions drawer's title line of revision `version`: `#2 · <title> Draft`. The items have no
 * role or test id of their own, so the line is matched by its text.
 */
const revisionLine = (screen: Screen, version: number, title: string, status: string) => {
    return screen
        .getByRole("dialog", "Entry revisions")
        .getByText(new RegExp(`^#${version} · ${title}\\s*${status}$`));
};

/**
 * Opens the options menu of revision `version` of `count` in the open revisions drawer. The list
 * shows the newest revision first, and its options buttons carry no test id in the tree, so the
 * button is picked by position.
 */
const openRevisionMenu = async (screen: Screen, version: number, count: number) => {
    await screen
        .getByTestId("cms.content-form.revisions")
        .getByRole("button")
        .nth(count - version)
        .tap();
};

/*
 * An entry goes through its life in the entry form: created and saved as a draft, edited, saved
 * and published, given a new revision that is published in turn, and unpublished.
 *
 * The model is made through the API, with no workflow, so nothing asks for a review. No licence
 * tag: entries, revisions and publishing are base Headless CMS.
 */
describe(
    "an entry is drafted, published and revised in the entry form",
    { serial: true, session: "admin", tags: ["cms", "cms-entries"] },
    () => {
        // Fresh per run, so earlier runs' models never match.
        const runId = createRunId();
        const title = `E2E life ${runId}`;
        let session: ApiSession | null = null;
        let model: TestModel | null = null;
        let entryId = "";

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
            // ADMIN BUG: the entry form asks "Leave site?" on reload even with nothing changed.
            await acceptEntryFormLeavePrompt(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        afterAll(async () => {
            if (!session || !model) {
                return;
            }
            const problems: (string | null)[] = [];
            if (entryId) {
                problems.push(
                    await deleteEntryPermanently(session, model, { id: entryId, entryId })
                );
            }
            problems.push(await deleteTestModel(session, model));
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("a new entry is saved as a draft", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            session = await waitForApiSession(captured);
            model = await createTestModel(session, runId, CMS_ENTRIES_MODEL);
            await openEntryList(app, screen, model);
            // An empty list shows a second New Entry button in its empty state.
            await screen.getByRole("button", "New Entry").first().tap();

            await screen.getByRole("textbox", "Title").fill(title);
            await screen.getByRole("spinbutton", "Price").fill("20");
            await screen.getByTestId("cms-content-save-content-button").tap();

            await expect(screen.getByText(`${title} saved successfully!`)).toBeVisible();
            await expect(screen.getByRole("button", "v1 (Draft)")).toBeVisible();
            const revisionId = new URL(await browser.url()).searchParams.get("id") ?? "";
            entryId = revisionId.split("#")[0];
            expect((await readEntryRecord(session, model, entryId))?.status).toBe("draft");
        });

        test("the draft is listed as Draft", async ({ screen }) => {
            await screen.getByRole("button", "Back").tap();

            await expect(entryRow(screen, title).getByRole("cell", "Draft (v1)")).toBeVisible();
        });

        test("an edit of the draft is saved", async ({ screen, browser }) => {
            await entryRow(screen, title).getByRole("link").tap();
            await screen.getByRole("spinbutton", "Price").fill("25");
            await screen.getByTestId("cms-content-save-content-button").tap();
            await expect(screen.getByText(`${title} saved successfully!`)).toBeVisible();

            await browser.reload();

            await expect(screen.getByRole("spinbutton", "Price")).toHaveValue("25");
            await expect(screen.getByRole("button", "v1 (Draft)")).toBeVisible();
        });

        test("Save & Publish asks first, then publishes", async ({ screen }) => {
            await screen.getByTestId("cms-content-save-publish-content-button").tap();
            const confirm = screen.getByRole("dialog", "Publish entry");
            await expect(
                confirm.getByText(`You are about to publish a record titled ${title}.`, {
                    exact: false
                })
            ).toBeVisible();
            await confirm.getByRole("button", "Yes, publish!").tap();

            await expect(screen.getByRole("button", "v1 (Published)")).toBeVisible();
            expect((await readEntryRecord(session!, model!, entryId))?.status).toBe("published");
        });

        test("a new revision is made from the published one", async ({ screen }) => {
            await screen.getByRole("button", "New Revision").tap();

            await expect(screen.getByRole("button", "v2 (Draft)")).toBeVisible();
            const revisions = await listEntryRevisions(session!, model!, entryId);
            expect(revisions.map(revision => [revision.version, revision.status])).toEqual([
                [1, "published"],
                [2, "draft"]
            ]);
        });

        test("the revisions list shows both revisions", async ({ screen }) => {
            await openRevisionsDrawer(screen);

            await expect(revisionLine(screen, 1, title, "Published")).toBeVisible();
            await expect(revisionLine(screen, 2, title, "Draft")).toBeVisible();
        });

        test("the new revision is published from the revisions list", async ({ screen }) => {
            await openRevisionMenu(screen, 2, 2);
            await pickMenuItem(screen, "Publish");
            await screen
                .getByRole("dialog", "Publish entry")
                .getByRole("button", "Yes, publish!")
                .tap();

            await expect(revisionLine(screen, 2, title, "Published")).toBeVisible();
            await expect(revisionLine(screen, 1, title, "Previously published")).toBeVisible();
            const revisions = await listEntryRevisions(session!, model!, entryId);
            expect(revisions.map(revision => [revision.version, revision.status])).toEqual([
                [1, "unpublished"],
                [2, "published"]
            ]);
        });

        test("the published revision is unpublished", async ({ screen }) => {
            await openRevisionMenu(screen, 2, 2);
            await pickMenuItem(screen, "Unpublish");
            await screen
                .getByRole("dialog", "Unpublish entry")
                .getByRole("button", "Yes, unpublish!")
                .tap();

            await expect(screen.getByRole("dialog", "Unpublish entry")).toBeHidden();
            await expect(revisionLine(screen, 2, title, "Previously published")).toBeVisible();
            await expect
                .poll(async () => (await readEntryRecord(session!, model!, entryId))?.status, {
                    timeout: 15_000,
                    message: "the entry was not unpublished"
                })
                .toBe("unpublished");
        });
    }
);
