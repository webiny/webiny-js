import type { Browser } from "@e2e-dev/web";
import { afterAll, afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import type { Screen } from "e2e";
import { expect } from "e2e";
import { captureApiSession, waitForApiSession } from "./support/apiSession.ts";
import type { ApiSession } from "./support/apiSession.ts";
import { createTestModel, deleteTestModel } from "./support/contentModel.ts";
import type { TestModel } from "./support/contentModel.ts";
import { recordPageErrorsFromNowOn, takePageErrors } from "./support/pageErrors.ts";
import { createTestTeam, deleteTestTeam } from "./support/team.ts";
import type { TestTeam } from "./support/team.ts";
import { deleteTestWorkflow, findModelWorkflowId } from "./support/workflow.ts";

/** Reads the id of the step card titled `title`, for the `step-card-<id>` test id. */
const findStepId = async (browser: Browser, title: string) => {
    const stepId = await browser.evaluate((stepTitle: string) => {
        const cards = [...document.querySelectorAll<HTMLElement>("[data-step-id]")];
        const card = cards.find(item => {
            return item
                .querySelector('[data-role="step-title-row"]')
                ?.textContent?.includes(stepTitle);
        });
        return card?.getAttribute("data-step-id") ?? null;
    }, title);
    if (!stepId) {
        throw new Error(`No step card titled "${title}".`);
    }
    return stepId;
};

/** The number tag of a step card. */
const stepNumber = (browser: Browser, stepId: string) => {
    return browser.locator(`[data-testid="step-card-${stepId}"] [data-role="step-number"]`);
};

/**
 * Opens the model's workflow in the editor. The editor first opens the first model it lists; a
 * model picked before that one has loaded is replaced by it, so the pick waits for it.
 */
const openModel = async (screen: Screen, model: TestModel) => {
    const detail = screen.getByTestId("rightPanel");
    const firstModelLoaded = screen
        .getByTestId("workflow-editor-header")
        .or(detail.getByText("has no workflow", { exact: false }));
    await expect(firstModelLoaded.first()).toBeVisible();

    await screen.getByPlaceholder("Search models").fill(model.name);
    const row = screen.getByTestId(`model-row-${model.modelId}`);
    await row.tap();
    await expect(row).toHaveAttribute("aria-current", "true");
    return row;
};

/**
 * Picks the team in the open drawer's Reviewing teams picker. The suggestion is chosen with the
 * keyboard: the list can open below the drawer's visible area, where it cannot be clicked.
 */
const pickTeam = async (screen: Screen, team: TestTeam) => {
    const picker = screen.getByRole("combobox", "Reviewing teams");
    await picker.fill(team.name);
    await expect(screen.getByRole("option", team.name, { exact: false })).toBeAttached();
    await picker.press("Enter");
};

/** Adds a People step through the type picker and fills its title and reviewing team. */
const addPeopleStep = async (screen: Screen, title: string, team: TestTeam) => {
    await screen.getByRole("button", "Add new step").tap();
    await screen.getByRole("dialog", "Add step").getByTestId("step-type-review").tap();

    const drawer = screen.getByRole("dialog", "Untitled step");
    await drawer.getByRole("textbox", "Title *").fill(title);
    await pickTeam(screen, team);
    await screen.getByRole("dialog", title).getByRole("button", "Done").tap();
    await expect(screen.getByRole("dialog", title)).toBeHidden();
};

/*
 * A workflow is built in the editor for a model of the test's own: created, given People steps,
 * reordered, saved, renamed and deleted.
 *
 * `wcp`: workflows only exist on a licensed project.
 */
describe(
    "a workflow is built and deleted in the editor",
    { serial: true, session: "admin", tags: ["wcp", "workflows"] },
    () => {
        // Fresh per run, so earlier runs' models and teams never match.
        const runId = String(Date.now());
        const renamed = `E2E renamed workflow ${runId}`;
        let session: ApiSession | null = null;
        let model: TestModel | null = null;
        let team: TestTeam | null = null;
        let legalStepId = "";
        let finalStepId = "";

        beforeEach(async ({ browser }) => {
            await recordPageErrorsFromNowOn(browser);
        });

        afterEach(async ({ browser }) => {
            expect(await takePageErrors(browser)).toEqual([]);
        });

        afterAll(async () => {
            if (!session) {
                return;
            }
            const problems: string[] = [];
            if (model) {
                const workflowId = await findModelWorkflowId(session, model);
                if (workflowId) {
                    problems.push((await deleteTestWorkflow(session, workflowId)) ?? "");
                }
                problems.push((await deleteTestModel(session, model)) ?? "");
            }
            if (team) {
                problems.push((await deleteTestTeam(session, team)) ?? "");
            }
            const failed = problems.filter(Boolean);
            if (failed.length > 0) {
                throw new Error(`Cleanup failed: ${failed.join("; ")}`);
            }
        });

        test("the test model has no workflow", async ({ app, screen, browser }) => {
            /*
             * The editor raises the browser's leave prompt (`beforeunload`) even with no unsaved
             * changes, so a reload after Save would stop the run. Accept the prompt; the header's
             * Unsaved changes tag and disabled Save are what this test checks for a clean editor.
             */
            await browser.onDialog(async dialog => {
                if (dialog.type === "beforeunload") {
                    await dialog.accept();
                    return;
                }
                await dialog.dismiss();
            });

            // The data is made before the editor opens, so its model panel lists the new model.
            const captured = await captureApiSession(browser);
            await app.open("/");
            session = await waitForApiSession(captured);
            model = await createTestModel(session, runId);
            team = await createTestTeam(session, runId);

            await app.open("/cms/workflows");
            const row = await openModel(screen, model);
            await expect(row.getByText("No workflow")).toBeVisible();
            const detail = screen.getByTestId("rightPanel");
            await expect(detail.getByText(`${model.name} has no workflow`)).toBeVisible();
        });

        test("a People step is added through the type picker", async ({ screen }) => {
            await screen.getByTestId("rightPanel").getByRole("button", "Create workflow").tap();
            await expect(screen.getByTestId("workflow-editor-header")).toBeVisible();
            await expect(screen.getByTestId("no-steps")).toBeVisible();

            await screen.getByRole("button", "Add new step").tap();
            const picker = screen.getByRole("dialog", "Add step");
            await expect(picker).toBeVisible();
            await picker.getByTestId("step-type-review").tap();

            const drawer = screen.getByRole("dialog", "Untitled step");
            await expect(drawer.getByRole("tab", "General")).toBeVisible();
            await expect(drawer.getByRole("tab", "Assignment")).toBeVisible();
            await expect(drawer.getByRole("tab", "Test routing")).toBeVisible();
        });

        test("a step without a title is refused on Save", async ({ screen, browser }) => {
            // Done keeps an incomplete step in the draft; Save checks it.
            await screen.getByRole("dialog", "Untitled step").getByRole("button", "Done").tap();
            await screen.getByTestId("workflow-editor-header").getByRole("button", "Save").tap();

            await expect(
                screen.getByText("Fix the highlighted steps before saving.")
            ).toBeVisible();
            const stepId = await findStepId(browser, "Untitled step");
            const card = screen.getByTestId(`step-card-${stepId}`);
            await expect(card.getByText("Enter a title for this step.")).toBeVisible();

            await card.getByRole("button", "Edit step").tap();
            const drawer = screen.getByRole("dialog", "Untitled step");
            // The tab names its error count: the missing title and the missing team.
            await expect(drawer.getByRole("tab", "General, 2 errors")).toBeVisible();
            await expect(browser.locator('[data-role="step-tab-error-count"]')).toHaveText("2");
            await expect(drawer.getByText("Enter a title for this step.")).toBeVisible();
        });

        test("the step is completed and shows on its card", async ({ screen, browser }) => {
            const drawer = screen.getByRole("dialog", "Untitled step");
            await drawer.getByRole("textbox", "Title *").fill("Legal review");
            await pickTeam(screen, team!);
            const completed = screen.getByRole("dialog", "Legal review");
            // With a title and a team the tab names no errors.
            await expect(completed.getByRole("tab", "General")).toBeVisible();
            await completed.getByRole("button", "Done").tap();
            await expect(screen.getByRole("dialog", "Legal review")).toBeHidden();

            legalStepId = await findStepId(browser, "Legal review");
            const card = screen.getByTestId(`step-card-${legalStepId}`);
            await expect(stepNumber(browser, legalStepId)).toHaveText("1");
            await expect(card.getByText("People", { exact: true })).toBeVisible();
        });

        test("a second step is moved up", async ({ screen, browser }) => {
            await addPeopleStep(screen, "Final review", team!);
            finalStepId = await findStepId(browser, "Final review");
            await expect(stepNumber(browser, finalStepId)).toHaveText("2");

            await screen.getByRole("button", "Move Final review up").tap();

            await expect(stepNumber(browser, finalStepId)).toHaveText("1");
            await expect(stepNumber(browser, legalStepId)).toHaveText("2");
        });

        test("the saved workflow keeps its steps after a reload", async ({ screen, browser }) => {
            const header = screen.getByTestId("workflow-editor-header");
            await header.getByRole("button", "Save").tap();
            await expect(header.getByText("Unsaved changes")).toBeHidden();
            await expect(header.getByRole("button", "Save")).toBeDisabled();

            await browser.reload();
            await openModel(screen, model!);

            await expect(
                header.getByText(`Applies to ${model!.name} (Headless CMS)`, { exact: false })
            ).toBeVisible();
            await expect(stepNumber(browser, finalStepId)).toHaveText("1");
            await expect(stepNumber(browser, legalStepId)).toHaveText("2");
        });

        test("the workflow is renamed in place", async ({ screen }) => {
            const header = screen.getByTestId("workflow-editor-header");
            await header.getByRole("button", "Workflow name").tap();
            const name = header.getByRole("textbox");
            await name.fill(renamed);
            await name.press("Enter");
            await expect(header.getByText(renamed)).toBeVisible();

            await header.getByRole("button", "Save").tap();
            await expect(header.getByRole("button", "Save")).toBeDisabled();
            await expect(header.getByText(renamed)).toBeVisible();
        });

        test("the workflow is deleted from the header", async ({ screen }) => {
            await screen
                .getByTestId("workflow-editor-header")
                .getByRole("button", "Delete workflow")
                .tap();
            const confirm = screen.getByRole("dialog", "Delete workflow?");
            await expect(confirm).toBeVisible();
            await confirm.getByRole("button", "Delete workflow").tap();

            const detail = screen.getByTestId("rightPanel");
            await expect(detail.getByText(`${model!.name} has no workflow`)).toBeVisible();
            const row = screen.getByTestId(`model-row-${model!.modelId}`);
            await expect(row.getByText("No workflow")).toBeVisible();
        });
    }
);
