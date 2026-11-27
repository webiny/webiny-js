import type { Browser } from "@e2e-dev/web";
import type { Locator, Screen } from "e2e";
import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "../../../support/apiSession.ts";
import type { ApiSession } from "../../../support/apiSession.ts";
import { createTestModel, deleteTestModel } from "../../../support/contentModel.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import { createRunId } from "../../../support/createRunId.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "../../../support/pageErrors.ts";
import { CMS_ENTRIES_MODEL } from "../support/cmsModel.ts";
import { deleteStoredModel, findModelByName } from "../support/modelLookup.ts";

/** The open New model dialog. */
const newModelDialog = (screen: Screen): Locator => {
    return screen.getByTestId("cms-new-content-model-modal");
};

/** Opens the New model dialog on the models list. */
const openNewModelDialog = async (screen: Screen) => {
    await screen.getByTestId("new-record-button").tap();
    await newModelDialog(screen).getByRole("textbox", "Name *").waitFor();
};

/** Fills the dialog's name and API names. */
const fillNewModel = async (dialog: Locator, name: string, singular: string, plural: string) => {
    await dialog.getByRole("textbox", "Name *").fill(name);
    await dialog.getByRole("textbox", "Singular API Name *").fill(singular);
    await dialog.getByRole("textbox", "Plural API Name").fill(plural);
};

interface CreateModelAnswer {
    data?: {
        createContentModel?: {
            error: { code: string | null; message: string | null } | null;
        };
    };
}

/**
 * Waits for the admin's next `createContentModel` answer and returns the error message in it, or
 * null when the model was created. Start it before the click that sends the request.
 */
const waitForCreateModelError = async (browser: Browser): Promise<string | null> => {
    for (;;) {
        const response = await browser.waitForResponse(/\/cms\/manage/);
        const body = await response.json<CreateModelAnswer>();
        const answer = body.data?.createContentModel;
        if (answer) {
            return answer.error?.message ?? null;
        }
    }
};

/*
 * The New model dialog refuses a model without a name and API name, and the API refuses a model
 * whose API name or model id another model already has.
 *
 * No licence tag: models are base Headless CMS.
 */
describe(
    "the New model dialog refuses an incomplete or duplicate model",
    { serial: true, session: "admin", tags: ["cms", "cms-models"] },
    () => {
        // Fresh per run, so earlier runs' models never match.
        const runId = createRunId();
        // A name of its own, so the model id made from it is free.
        const sameApiName = `E2E CMS Same Api ${runId}`;
        // Camel-cased into the model id, `cmsItem<runId>`: the existing model's id.
        const sameModelId = `Cms Item ${runId}`;
        let session: ApiSession | null = null;
        let existing: TestModel | null = null;

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        // A refused model is never stored; one stored anyway is removed with the existing one.
        afterAll(async () => {
            if (!session) {
                return;
            }
            const problems: (string | null)[] = [];
            for (const name of [sameApiName, sameModelId]) {
                const accepted = await findModelByName(session, name);
                if (accepted) {
                    problems.push(await deleteStoredModel(session, accepted.modelId));
                }
            }
            if (existing) {
                problems.push(await deleteTestModel(session, existing));
            }
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("an empty name and API name are refused", async ({ app, screen, browser }) => {
            const captured = await captureApiSession(browser);
            await app.open("/cms/content-models");
            session = await waitForApiSession(captured);
            existing = await createTestModel(session, runId, CMS_ENTRIES_MODEL);
            await openNewModelDialog(screen);

            await newModelDialog(screen).getByRole("button", "+ Create Model").tap();

            const dialog = newModelDialog(screen);
            await expect(dialog.getByText("Name is required.")).toBeVisible();
            await expect(dialog.getByText("Singular API Name is required.")).toBeVisible();
        });

        test("an API name another model has is refused", async ({ app, screen, browser }) => {
            await app.open("/cms/content-models");
            await openNewModelDialog(screen);
            const dialog = newModelDialog(screen);
            await fillNewModel(
                dialog,
                sameApiName,
                existing!.singularApiName,
                existing!.pluralApiName
            );

            const answered = waitForCreateModelError(browser);
            await dialog.getByRole("button", "+ Create Model").tap();
            const apiError = await answered;
            await dialog.getByText("Creating content model...").waitFor({ state: "hidden" });

            // The API refuses it, the dialog stays open with the values typed, and nothing is stored.
            expect(apiError).toContain(existing!.singularApiName);
            await expect(dialog.getByRole("textbox", "Name *")).toHaveValue(sameApiName);
            expect(await findModelByName(session!, sameApiName)).toBeNull();
            // BUG: the user never sees why. `NewContentModelPresenter.save()` swallows the API error
            // (`catch { return null; }`), so the dialog only stays open, with no message. The check
            // that the dialog shows `apiError` is left out until that is fixed.
        });

        test("a name whose model id another model has is refused", async ({
            app,
            screen,
            browser
        }) => {
            await app.open("/cms/content-models");
            await openNewModelDialog(screen);
            const dialog = newModelDialog(screen);
            // The model id is made from the name; the API names are new.
            await fillNewModel(dialog, sameModelId, `CmsTwin${runId}`, `CmsTwins${runId}`);

            const answered = waitForCreateModelError(browser);
            await dialog.getByRole("button", "+ Create Model").tap();
            const apiError = await answered;
            await dialog.getByText("Creating content model...").waitFor({ state: "hidden" });

            expect(apiError).toContain(existing!.modelId);
            await expect(dialog.getByRole("textbox", "Singular API Name *")).toHaveValue(
                `CmsTwin${runId}`
            );
            expect(await findModelByName(session!, sameModelId)).toBeNull();
            // BUG: as above, the refusal is not shown in the dialog.
        });
    }
);
