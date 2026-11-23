import { afterEach, beforeEach, describe, test } from "@e2e-dev/web";
import { expect } from "e2e";
import { recordPageErrorsFromNowOn, takePageErrors } from "./support/pageErrors.ts";

/*
 * Every workflows page opens and shows its landmark. Each test opens its page in a browser of its
 * own and reads nothing it did not create, so these run on any licensed project.
 *
 * `wcp`: workflows only exist on a licensed project.
 */
describe("workflows pages open", { session: "admin", tags: ["wcp", "workflows"] }, () => {
    beforeEach(async ({ browser }) => {
        await recordPageErrorsFromNowOn(browser);
    });

    afterEach(async ({ browser }) => {
        expect(await takePageErrors(browser)).toEqual([]);
    });

    test("the Headless CMS Content Reviews list shows its controls", async ({ app, screen }) => {
        await app.open("/cms/content-reviews");

        await expect(screen.getByRole("heading", "Content Reviews")).toBeVisible();
        await expect(screen.getByRole("radiogroup", "Whose reviews")).toBeVisible();
        await expect(screen.getByRole("radiogroup", "Review state")).toBeVisible();
    });

    test("the Content Reviews scope and state are kept in the URL", async ({
        app,
        screen,
        browser
    }) => {
        await app.open("/cms/content-reviews");

        const scopes = screen.getByRole("radiogroup", "Whose reviews");
        const states = screen.getByRole("radiogroup", "Review state");
        await scopes.getByRole("radio", "Requested by me").tap();
        await expect(browser).toHaveURL(/[?&]scope=myRequests(&|$)/);
        await states.getByRole("radio", "Approved").tap();
        await expect(browser).toHaveURL(/[?&]state=approved(&|$)/);

        await browser.reload();

        await expect(browser).toHaveURL(/[?&]scope=myRequests(&|$)/);
        await expect(browser).toHaveURL(/[?&]state=approved(&|$)/);
        await expect(scopes.getByRole("radio", "Requested by me")).toBeChecked();
        await expect(states.getByRole("radio", "Approved")).toBeChecked();
    });

    test("the Website Builder Content Reviews list shows its controls", async ({ app, screen }) => {
        await app.open("/website-builder/pages/content-reviews");

        await expect(screen.getByRole("heading", "Content Reviews")).toBeVisible();
        await expect(screen.getByRole("radiogroup", "Whose reviews")).toBeVisible();
        await expect(screen.getByRole("radiogroup", "Review state")).toBeVisible();
    });

    test("the Headless CMS workflow editor lists content models", async ({ app, screen }) => {
        await app.open("/cms/workflows");

        const panel = screen.getByTestId("model-panel");
        await expect(panel.getByText("Content models")).toBeVisible();
    });

    test("the Website Builder workflow editor lists its pages", async ({ app, screen }) => {
        await app.open("/website-builder/workflows");

        const panel = screen.getByTestId("model-panel");
        await expect(panel.getByText("Website Builder")).toBeVisible();
    });

    test("the reviewer exclusions page opens and cancels the Add exclusion dialog", async ({
        app,
        screen
    }) => {
        await app.open("/settings/workflows/exclusions");

        await expect(screen.getByRole("heading", "Reviewer exclusions")).toBeVisible();
        // The empty list can show an Add exclusion button too; the toolbar's is always there.
        const add = screen.getByTestId("exclusions-toolbar").getByRole("button", "Add exclusion");
        await expect(add).toBeVisible();

        await add.tap();
        const dialog = screen.getByRole("dialog", "Add exclusion");
        await expect(dialog).toBeVisible();
        await dialog.getByRole("button", "Cancel").tap();
        await expect(dialog).toBeHidden();
    });
});
