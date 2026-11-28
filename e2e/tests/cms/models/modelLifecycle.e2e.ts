import type { Screen } from "e2e";
import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "../../../support/apiSession.ts";
import type { ApiSession } from "../../../support/apiSession.ts";
import { createRunId } from "../../../support/createRunId.ts";
import { acceptEntryFormLeavePrompt } from "../../../support/leavePrompt.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "../../../support/pageErrors.ts";
import {
    deleteStoredGroup,
    deleteStoredModel,
    findGroupByName,
    findModelByName
} from "../support/modelLookup.ts";

/** How long one load of the models list may take to show a model. */
const PER_LOAD_TIMEOUT = 5_000;

/** The editor's row of the field labelled `label`. */
const fieldRow = (screen: Screen, label: string) => {
    return screen.getByTestId("cms.editor.field-row").filter({ hasText: label });
};

/** Fills the open field settings dialog's General tab and saves the field. */
const fillFieldSettings = async (screen: Screen, label: string, fieldId: string) => {
    const dialog = screen.getByTestId("cms-editor-edit-fields-dialog");
    await dialog.getByRole("textbox", "Label *").fill(label);
    await dialog.getByRole("textbox", "Field ID *").fill(fieldId);
    return dialog;
};

/*
 * A content model is built in the UI: its group, the model through the New model dialog, a text
 * and a number field dragged into the editor, the text field required and the entry title. The
 * model is then saved, renamed and deleted from the list.
 *
 * Reloading or leaving the model editor raises the browser's leave prompt even when the model is
 * saved, the same bug as the entry form's (`support/leavePrompt.ts`), so that prompt is accepted.
 *
 * No licence tag: models, groups and the editor are base Headless CMS.
 */
describe(
    "a content model is created, edited and deleted",
    { serial: true, session: "admin", tags: ["cms", "cms-models"] },
    () => {
        // Fresh per run, so earlier runs' models and groups never match.
        const runId = createRunId();
        const groupName = `E2E cms group ${runId}`;
        const modelName = `E2E CMS Life ${runId}`;
        const renamed = `E2E CMS Renamed ${runId}`;
        const singularApiName = `CmsLife${runId}`;
        let session: ApiSession | null = null;
        let modelId = "";

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
            // ADMIN BUG: the model editor asks "Leave site?" on reload even when saved.
            await acceptEntryFormLeavePrompt(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        // The model goes first, so its group can be deleted. Either may be gone already.
        afterAll(async () => {
            if (!session) {
                return;
            }
            const problems: (string | null)[] = [];
            const model =
                (await findModelByName(session, renamed)) ??
                (await findModelByName(session, modelName));
            if (model) {
                problems.push(await deleteStoredModel(session, model.modelId));
            }
            const group = await findGroupByName(session, groupName);
            if (group) {
                problems.push(await deleteStoredGroup(session, group.id));
            }
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("a model group is created", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/cms/content-model-groups");
            session = await waitForApiSession(captured);

            await screen.getByTestId("new-group-button").tap();
            const form = screen.getByTestId("pb-content-model-groups-form");
            await form.getByRole("textbox", "Name *").fill(groupName);
            await form.getByTestId("cms.form.group.submit").tap();

            await expect(screen.getByText("Content model group saved successfully!")).toBeVisible();
            await expect(
                screen.getByTestId("default-data-list").getByText(groupName, { exact: true })
            ).toBeVisible();
            // The slug is made from the name.
            await expect(form.getByRole("textbox", "Slug *")).toHaveValue(`e2e-cms-group-${runId}`);
        });

        test("the New model dialog asks for both API names itself", async ({ app, screen }) => {
            await app.open("/cms/content-models");
            await screen.getByTestId("new-record-button").tap();
            const dialog = screen.getByTestId("cms-new-content-model-modal");

            await dialog.getByRole("textbox", "Name *").fill(modelName);

            // The API names are not derived from the name: the user types them.
            await expect(dialog.getByRole("textbox", "Singular API Name *")).toHaveValue("");
            await expect(dialog.getByRole("textbox", "Plural API Name *")).toHaveValue("");
        });

        test("the model is created in the group without default fields", async ({
            screen,
            browser
        }) => {
            const dialog = screen.getByTestId("cms-new-content-model-modal");
            await dialog.getByRole("textbox", "Singular API Name *").fill(singularApiName);
            await dialog.getByRole("textbox", "Plural API Name *").fill(`CmsLifes${runId}`);
            await dialog.getByRole("combobox", "Content model group *").tap();
            await screen.getByRole("option", groupName).tap();
            await dialog.getByRole("switch", "Create model with default fields").tap();
            await dialog.getByRole("button", "+ Create Model").tap();

            await expect(screen.getByTestId("cms-editor-model-title")).toHaveText(modelName);
            await expect(screen.getByTestId("cms-editor-first-field-area")).toBeVisible();
            // The model id is made from the name; the editor's URL carries it.
            const url = await browser.url();
            modelId = new URL(url).pathname.split("/").pop() ?? "";
            const stored = await findModelByName(session!, modelName);
            expect(stored?.modelId).toBe(modelId);
            expect(stored?.group).toBe(`e2e-cms-group-${runId}`);
        });

        test("a required text field is dragged into the empty model", async ({ screen }) => {
            await screen
                .getByTestId("cms-editor-fields-field-text")
                .dragTo(screen.getByTestId("cms-editor-first-field-area"));
            const dialog = await fillFieldSettings(screen, "Title", "title");
            await dialog.getByRole("tab", "Validations").tap();
            // Every validator's switch is named "Enabled": the validator's header names it.
            await dialog
                .getByRole("button", /^Required\b/)
                .getByRole("switch", "Enabled")
                .tap();
            await dialog.getByTestId("cms.editor.field.settings.save").tap();

            await expect(dialog).toBeHidden();
            await expect(fieldRow(screen, "Title")).toBeVisible();
        });

        test("a number field is dragged below it", async ({ screen }) => {
            /*
             * The drop zone below a row sits behind the row until a drag starts, so `dragTo` cannot
             * aim at it. The pointer is dragged instead, to just below the Title row, where the zone
             * appears once the drag is under way.
             */
            const source = await screen.getByTestId("cms-editor-fields-field-number").boundingBox();
            const row = await fieldRow(screen, "Title").boundingBox();
            if (!source || !row) {
                throw new Error("The Number field type or the Title row has no box.");
            }
            await screen.swipe({
                from: { x: source.x + source.width / 2, y: source.y + source.height / 2 },
                to: { x: row.x + row.width / 2, y: row.y + row.height + 6 },
                duration: 1_000
            });
            const dialog = await fillFieldSettings(screen, "Price", "price");
            await dialog.getByTestId("cms.editor.field.settings.save").tap();

            await expect(dialog).toBeHidden();
            await expect(fieldRow(screen, "Price")).toBeVisible();
        });

        test("the text field is made the entry title", async ({ screen }) => {
            await fieldRow(screen, "Title").getByRole("button").last().tap();
            await screen.getByRole("menuitem", /Use as title/).tap();

            // The model's stored title field is checked once the model is saved.
            await expect(screen.getByText("Title field set successfully.")).toBeVisible();
        });

        test("the saved model keeps its fields after a reload", async ({ screen, browser }) => {
            await screen.getByTestId("cms.editor.defaultbar.save").tap();
            await expect(
                screen.getByText("Your content model was saved successfully!")
            ).toBeVisible();

            await browser.reload();

            await expect(fieldRow(screen, "Title")).toBeVisible();
            await expect(fieldRow(screen, "Price")).toBeVisible();
            const stored = await findModelByName(session!, modelName);
            expect(stored?.titleFieldId).toBe("title");
            expect(stored?.fields.map(field => [field.fieldId, field.type])).toEqual([
                ["title", "text"],
                ["price", "number"]
            ]);
            const title = stored?.fields.find(field => field.fieldId === "title");
            expect(title?.validation?.map(validator => validator.name)).toContain("required");
        });

        test("the model is renamed in the editor", async ({ screen }) => {
            await screen.getByTestId("cms-editor-model-title").tap();
            const name = screen.getByTestId("cms-editor-top-bar").getByRole("textbox");
            await name.fill(renamed);
            await name.press("Enter");
            await screen.getByTestId("cms.editor.defaultbar.save").tap();

            await expect(
                screen.getByText("Your content model was saved successfully!")
            ).toBeVisible();
            await expect(screen.getByTestId("cms-editor-model-title")).toHaveText(renamed);
            expect((await findModelByName(session!, renamed))?.modelId).toBe(modelId);
        });

        test("the model is deleted from the list after typing the confirmation", async ({
            app,
            screen
        }) => {
            await app.open("/cms/content-models");
            await screen.getByPlaceholder("Search content model...").fill(renamed);
            const list = screen.getByTestId("default-data-list");
            await expect(list.getByText(renamed, { exact: true })).toBeVisible();
            // The search leaves only this model; its options button is the list's one visible button.
            await list.getByRole("button").last().tap();
            await screen.getByRole("menuitem", /Delete/).tap();
            const dialog = screen.getByTestId("cms-delete-content-model-dialog");
            await dialog.getByTestId("cms-delete-content-model-confirm-button").tap();
            await dialog.getByTestId("cms-delete-content-model-input").fill(`delete ${modelId}`);
            await dialog.getByTestId("cms-delete-content-model-confirm-button").tap();
            await expect(
                dialog.getByText("deletion process was started", { exact: false })
            ).toBeVisible();
            await dialog.getByTestId("cms-delete-content-model-close-button").tap();

            // The deletion runs in the background; the model leaves the list when it is done.
            await expect
                .poll(async () => findModelByName(session!, renamed), {
                    timeout: 90_000,
                    interval: 2_000,
                    message: `${renamed} was not deleted`
                })
                .toBeNull();
            // A list read right after the delete can still return the model, so the list is loaded
            // again until the model stays away for a whole load.
            const isGoneAfterLoad = async () => {
                await app.open("/cms/content-models");
                try {
                    await screen
                        .getByTestId("default-data-list")
                        .getByText(renamed, { exact: true })
                        .waitFor({ timeout: PER_LOAD_TIMEOUT });
                    return false;
                } catch {
                    return true;
                }
            };
            await expect
                .poll(isGoneAfterLoad, {
                    timeout: 90_000,
                    interval: 1_000,
                    message: `${renamed} was still listed after reloading the list`
                })
                .toBe(true);
        });
    }
);
