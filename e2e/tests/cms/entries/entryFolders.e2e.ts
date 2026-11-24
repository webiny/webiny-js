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
import { deleteEntryFolder, findEntryFolder } from "../support/entryFolder.ts";
import type { EntryFolder } from "../support/entryFolder.ts";
import { entryRow, openEntryList, openEntryRowMenu, pickMenuItem } from "../support/entryList.ts";
import { readEntryRecord } from "../support/entryRecord.ts";

/** The folder every entry starts in. */
const ROOT_FOLDER_ID = "root";

/** Moves the entry titled `title` to the folder labelled `target` through its row menu. */
const moveEntryTo = async (screen: Screen, title: string, target: string) => {
    await openEntryRowMenu(screen, title);
    await pickMenuItem(screen, "Move");
    const dialog = screen.getByRole("dialog", "Move entry to a new location");
    await dialog.getByText(target, { exact: true }).tap();
    await dialog.getByRole("button", "Move entry").tap();
};

/*
 * A folder is created in the entry list's sidebar, an entry is moved into it and found there, then
 * moved back, and the folder is deleted.
 *
 * No licence tag: folders are base ACO. Folder-level permissions, which need a licence, are not
 * touched: the folder keeps the permissions it inherits.
 */
describe(
    "entries are moved in and out of a folder",
    { serial: true, session: "admin", tags: ["cms", "cms-entries"] },
    () => {
        // Fresh per run, so earlier runs' models and folders never match.
        const runId = createRunId();
        const title = `E2E filed ${runId}`;
        const folderTitle = `E2E folder ${runId}`;
        let session: ApiSession | null = null;
        let model: TestModel | null = null;
        let entry: TestEntry | null = null;
        let folder: EntryFolder | null = null;

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        // The entry goes first, so the folder is empty; the folder may be gone already.
        afterAll(async () => {
            if (!session || !model) {
                return;
            }
            const problems: (string | null)[] = [];
            if (entry) {
                problems.push(await deleteEntryPermanently(session, model, entry));
            }
            const left = await findEntryFolder(session, model, folderTitle);
            if (left) {
                problems.push(await deleteEntryFolder(session, left));
            }
            problems.push(await deleteTestModel(session, model));
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("a folder is created in the entry list", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/");
            session = await waitForApiSession(captured);
            model = await createTestModel(session, runId, CMS_ENTRIES_MODEL);
            entry = await createDraftEntry(session, model, title, { price: 5 });
            await openEntryList(app, screen, model);

            await screen.getByRole("button", "New Folder").tap();
            const dialog = screen.getByRole("dialog", "Create a new folder");
            await dialog.getByRole("textbox", "Title *").fill(folderTitle);
            await dialog.getByRole("button", "Create folder").tap();

            await expect(screen.getByText("Folder created successfully!")).toBeVisible();
            await expect(
                screen.getByTestId("leftPanel").getByText(folderTitle, { exact: true })
            ).toBeVisible();
            folder = await findEntryFolder(session, model, folderTitle);
            expect(folder).not.toBeNull();
        });

        test("an entry is moved into the folder", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);

            await moveEntryTo(screen, title, folderTitle);

            await expect(
                screen.getByText(`Entry "${title}" was moved to "${folderTitle}".`)
            ).toBeVisible();
            await expect(entryRow(screen, title)).toBeHidden();
            expect((await readEntryRecord(session!, model!, entry!.entryId))?.folderId).toBe(
                folder!.id
            );
        });

        test("the folder lists the entry", async ({ app, screen }) => {
            await openEntryList(app, screen, model!);

            await screen.getByTestId("leftPanel").getByText(folderTitle, { exact: true }).tap();

            await expect(screen.getByRole("heading", folderTitle)).toBeVisible();
            await expect(entryRow(screen, title)).toBeVisible();
        });

        test("the entry is moved back to Home", async ({ screen }) => {
            await moveEntryTo(screen, title, "Home");

            await expect(screen.getByText(`Entry "${title}" was moved to "Home".`)).toBeVisible();
            await expect(entryRow(screen, title)).toBeHidden();
            expect((await readEntryRecord(session!, model!, entry!.entryId))?.folderId).toBe(
                ROOT_FOLDER_ID
            );
        });

        test("the empty folder is deleted", async ({ app, screen }) => {
            // The list reopens the folder it showed last, so Home is picked in the sidebar.
            await openEntryList(app, screen, model!);
            await screen.getByTestId("leftPanel").getByText("Home", { exact: true }).tap();
            await expect(screen.getByRole("heading", "Home")).toBeVisible();

            await entryRow(screen, folderTitle).getByTestId("table.row.folder.menu-action").tap();
            await pickMenuItem(screen, "Delete");
            await screen
                .getByRole("dialog", "Delete folder")
                .getByRole("button", "Delete folder")
                .tap();

            await expect(
                screen.getByText(`The folder "${folderTitle}" was deleted successfully.`)
            ).toBeVisible();
            await expect(entryRow(screen, folderTitle)).toBeHidden();
            await expect(entryRow(screen, title)).toBeVisible();
            expect(await findEntryFolder(session!, model!, folderTitle)).toBeNull();
        });
    }
);
