import { test } from "@e2e-dev/web";
import { credentials, expect } from "e2e";

// No tags and no agent steps: runs on any project, licensed or not, without a model.
test("the admin signs in and lands on the dashboard", async ({ app, screen, browser }) => {
    const admin = credentials.user("admin");

    await app.open("/");
    await screen.getByLabel("Email").fill(admin.username);
    await screen.getByLabel("Password").fill(admin.password);
    await screen.getByRole("button", "Submit").tap();

    await expect(screen.getByLabel("Password")).toBeHidden({ timeout: 30_000 });
    // The dashboard route's layout sets the document title.
    await expect(browser).toHaveTitle(/Welcome!/);
});
