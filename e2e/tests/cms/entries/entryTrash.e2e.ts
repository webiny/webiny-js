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
import { recordPageErrorsFromNowOn, takePageErrors } from "../../../support/pageErrors.ts";
import { CMS_ENTRIES_MODEL } from "../support/cmsModel.ts";
import { entryRow, openEntryList, openEntryRowMenu, pickMenuItem } from "../support/entryList.ts";
import { readEntryRecord } from "../support/entryRecord.ts";
import { isEntryInTrash, moveEntryToTrash } from "../support/trashBin.ts";

/** Opens the model's trash from the list's sidebar. */
const openTrash = async (screen: Screen, model: TestModel) => {
    // The sidebar item is named by its icon and its text.
    await screen.getByRole("button", "Delete Trash").tap();
    await screen.getByRole("heading", `Trash - ${model.name}`).waitFor();
};

/**
 * The trash's row of the entry titled `title`. The entry list stays in the tree behind the trash,
 * so a trash row is told apart by its trash options button.
 */
const trashRow = (screen: Screen, title: string) => {
    return entryRow(screen, title).filter({
        has: screen.getByTestId("table.row.trash.entry.menu-action")
    });
};

/** Opens the options menu of the trash row titled `title`. */
const openTrashRowMenu = async (screen: Screen, title: string) => {
    await trashRow(screen, title).getByTestId("table.row.trash.entry.menu-action").tap();
};

/*
 * An entry goes to the trash from its row menu, is listed in the trash and restored from it, and
 * another is deleted from the trash for good. Each state is checked through the API too.
 *
 * No licence tag: the trash is base Headless CMS.
 */
describe(
    "entries are trashed, restored and deleted for good",
    { serial: true, session: "admin", tags: ["cms", "cms-entries"] },
    () => {
        // Fresh per run, so earlier runs' models never match.
        const runId = createRunId();
        const keptTitle = `E2E kept ${runId}`;
        const droppedTitle = `E2E dropped ${runId}`;
        let session: ApiSession | null = null;
        let model: TestModel | null = null;
        let kept: TestEntry | null = null;
        let dropped: TestEntry | null = null;

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        // Deleting permanently works on trashed entries too; one already gone reports nothing.
        afterAll(async () => {
            if (!session || !model) {
                return;
            }
            const problems: (string | null)[] = [];
            for (const entry of [kept, dropped]) {
                if (entry) {
                    const error = await deleteEntryPermanently(session, model, entry);
                    problems.push(error && !/not found/i.test(error) ? error : null);
                }
            }
            problems.push(await deleteTestModel(session, model));
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("an entry is trashed from its row menu", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            session = await waitForApiSession(captured);
            model = await createTestModel(session, runId, CMS_ENTRIES_MODEL);
            kept = await createDraftEntry(session, model, keptTitle, { price: 1 });
            dropped = await createDraftEntry(session, model, droppedTitle, { price: 2 });
            // The second entry goes to the trash through the API; the UI deletes it from there.
            await moveEntryToTrash(session, model, dropped);
            await openEntryList(app, screen, model);

            await openEntryRowMenu(screen, keptTitle);
            await pickMenuItem(screen, "Trash");
            const confirm = screen.getByRole("dialog", "Trash entry");
            await expect(
                confirm.getByText("This action will include all of the revisions.", {
                    exact: false
                })
            ).toBeVisible();
            await confirm.getByRole("button", "Confirm").tap();

            await expect(entryRow(screen, keptTitle)).toBeHidden();
            // The row leaves the list before the API has answered.
            await expect
                .poll(async () => isEntryInTrash(session!, model!, kept!), {
                    timeout: 15_000,
                    message: `${keptTitle} did not reach the trash`
                })
                .toBe(true);
            expect(await readEntryRecord(session, model, kept.entryId)).toBeNull();
        });

        test("the trashed entry is listed in the trash", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);

            await openTrash(screen, model!);

            await expect(trashRow(screen, keptTitle)).toBeVisible();
            await expect(trashRow(screen, droppedTitle)).toBeVisible();
        });

        test("the entry is restored from the trash", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);
            await openTrash(screen, model!);

            await openTrashRowMenu(screen, keptTitle);
            await pickMenuItem(screen, "Restore");
            await screen.getByRole("dialog", "Restore item").getByRole("button").last().tap();

            await expect(screen.getByText(`${keptTitle} was restored successfully!`)).toBeVisible();
            await expect(trashRow(screen, keptTitle)).toBeHidden();
            expect(await isEntryInTrash(session!, model!, kept!)).toBe(false);
            expect((await readEntryRecord(session!, model!, kept!.entryId))?.status).toBe("draft");
        });

        test("the restored entry is back in the list", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);

            await expect(entryRow(screen, keptTitle)).toBeVisible();
        });

        test("another entry is deleted for good from the trash", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);
            await openTrash(screen, model!);

            await openTrashRowMenu(screen, droppedTitle);
            await pickMenuItem(screen, "Delete");
            await screen.getByRole("dialog", "Delete item").getByRole("button").last().tap();

            await expect(
                screen.getByText(`${droppedTitle} was deleted successfully!`)
            ).toBeVisible();
            await expect(trashRow(screen, droppedTitle)).toBeHidden();
            expect(await isEntryInTrash(session!, model!, dropped!)).toBe(false);
            expect(await readEntryRecord(session!, model!, dropped!.entryId)).toBeNull();
        });
    }
);
