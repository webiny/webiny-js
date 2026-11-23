import type { Screen } from "e2e";
import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "../../../support/apiSession.ts";
import type { ApiSession } from "../../../support/apiSession.ts";
import { createTestModel, deleteTestModel } from "../../../support/contentModel.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import { createDraftEntry, deleteEntryPermanently } from "../../../support/entry.ts";
import type { TestEntry } from "../../../support/entry.ts";
import { createRunId } from "../../../support/createRunId.ts";
import { acceptEntryFormLeavePrompt } from "../../../support/leavePrompt.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "../../../support/pageErrors.ts";
import { CMS_ENTRIES_MODEL } from "../support/cmsModel.ts";
import { entryRow, openEntryList } from "../support/entryList.ts";
import { publishRevision } from "../support/publishRevision.ts";

const NAMES = ["alpha", "beta", "gamma"] as const;

type EntryName = (typeof NAMES)[number];

/** The order in which the list shows this run's rows, by name. */
const readRowOrder = async (screen: Screen, runId: string): Promise<EntryName[]> => {
    const rows = await screen
        .getByRole("row", new RegExp(`E2E (alpha|beta|gamma) ${runId}`))
        .allTextContents();
    return rows.map(text => NAMES.find(name => text.includes(`E2E ${name} ${runId}`))!);
};

/** Opens the list's filter bar and picks `status` in its status filter. */
const filterByStatus = async (screen: Screen, status: string) => {
    const filters = screen.getByTestId("filters-container");
    if (!(await filters.isVisible())) {
        // The toggle has no name: it is the first button of the list's header.
        await screen.getByTestId("rightPanel").getByRole("button").first().tap();
    }
    await filters.getByRole("combobox").tap();
    await screen.getByRole("option", status).tap();
};

/*
 * The entry list finds, sorts, filters and opens entries. The model is made through the API, with
 * three entries of unique titles, one of them published. The model is this run's own, but the
 * checks still go through the titles rather than counts.
 *
 * No licence tag: the entry list is base Headless CMS.
 */
describe(
    "the entry list searches, sorts, filters and opens entries",
    { serial: true, session: "admin", tags: ["cms", "cms-entries"] },
    () => {
        // Fresh per run, so earlier runs' models never match.
        const runId = createRunId();
        const title = (name: EntryName) => `E2E ${name} ${runId}`;
        let session: ApiSession | null = null;
        let model: TestModel | null = null;
        const entries: TestEntry[] = [];

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
            // ADMIN BUG: the entry form asks "Leave site?" on unload even with nothing changed.
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
            for (const entry of entries) {
                problems.push(await deleteEntryPermanently(session, model, entry));
            }
            problems.push(await deleteTestModel(session, model));
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("a search by title finds the row", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            session = await waitForApiSession(captured);
            model = await createTestModel(session, runId, CMS_ENTRIES_MODEL);
            entries.push(await createDraftEntry(session, model, title("alpha"), { price: 30 }));
            entries.push(await createDraftEntry(session, model, title("beta"), { price: 10 }));
            entries.push(await createDraftEntry(session, model, title("gamma"), { price: 20 }));
            await publishRevision(session, model, entries[0]);
            await openEntryList(app, screen, model);
            await entryRow(screen, title("alpha")).waitFor();

            await screen.getByPlaceholder("Search...").fill(title("beta"));

            await expect(entryRow(screen, title("beta"))).toBeVisible();
            await expect(entryRow(screen, title("alpha"))).toBeHidden();
            await expect(entryRow(screen, title("gamma"))).toBeHidden();
        });

        test("sorting by name reverses the order of the rows", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);
            await entryRow(screen, title("gamma")).waitFor();
            const nameHeader = screen
                .getByRole("columnheader", /^Select all Name/)
                .getByText("Name", { exact: true });
            const ascending: EntryName[] = ["alpha", "beta", "gamma"];
            const descending: EntryName[] = ["gamma", "beta", "alpha"];
            await nameHeader.tap();
            // The first click sorts by name in one direction or the other.
            await expect
                .poll(async () => {
                    const order = await readRowOrder(screen, runId);
                    return [ascending, descending].some(sorted => {
                        return sorted.join() === order.join();
                    });
                })
                .toBe(true);
            const first = await readRowOrder(screen, runId);

            await nameHeader.tap();

            await expect
                .poll(async () => readRowOrder(screen, runId), {
                    message: "the second click did not reverse the order"
                })
                .toEqual([...first].reverse());
            await expect(entryRow(screen, title("beta"))).toBeVisible();
        });

        test("the status filter narrows the list to published entries", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);
            await entryRow(screen, title("alpha")).waitFor();

            await filterByStatus(screen, "Published");

            await expect(entryRow(screen, title("alpha"))).toBeVisible();
            await expect(entryRow(screen, title("beta"))).toBeHidden();
            await expect(entryRow(screen, title("gamma"))).toBeHidden();
        });

        test("the status filter narrows the list to drafts", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);
            await entryRow(screen, title("alpha")).waitFor();

            await filterByStatus(screen, "Draft");

            await expect(entryRow(screen, title("beta"))).toBeVisible();
            await expect(entryRow(screen, title("gamma"))).toBeVisible();
            await expect(entryRow(screen, title("alpha"))).toBeHidden();
        });

        test("an entry opens from its row", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);

            await entryRow(screen, title("gamma")).getByRole("link").tap();

            await expect(screen.getByRole("heading", title("gamma"))).toBeVisible();
            await expect(screen.getByRole("textbox", "Title")).toHaveValue(title("gamma"));
            await expect(screen.getByRole("spinbutton", "Price")).toHaveValue("20");
        });
    }
);
