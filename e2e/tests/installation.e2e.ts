import { test } from "@e2e-dev/web";
import { credentials, expect } from "e2e";

// The wizard only shows on a project that has never been installed, so on any other project this
// test can only fail. CI sets E2E_INSTALLATION=1 on a freshly built project and runs it before
// everything else, since it creates the admin user the other tests sign in with.
test(
    "the installation wizard installs the project and the admin lands on the dashboard",
    {
        tags: ["installation"],
        skip: process.env.E2E_INSTALLATION === "1" ? undefined : "needs a never-installed project",
        // A second attempt finds the project half installed and fails differently, hiding the cause.
        retries: 0
    },
    async ({ app, screen, browser }) => {
        const admin = credentials.user("admin");

        await app.open("/");
        await screen.getByRole("button", "Let's get started").tap();

        await screen.getByLabel("Project name").fill("Webiny (E2E)");
        await screen.getByLabel("Organization name").fill("Webiny");
        await screen.getByRole("combobox").tap();
        await screen.getByRole("option", "GitHub").tap();
        // Until the dropdown has closed, its overlay takes the next click.
        await expect(screen.getByRole("listbox")).toBeHidden();
        // `check()` reads the state right after its click, before this controlled checkbox
        // re-renders, and reports the click as lost.
        const terms = screen.getByLabel(/I agree to Webiny/);
        await terms.tap();
        await expect(terms).toBeChecked();
        await screen.getByRole("button", "Next step").tap();

        await screen.getByLabel("First name").fill("admin-first-name");
        await screen.getByLabel("Last name").fill("admin-last-name");
        await screen.getByLabel("Your email").fill(admin.username);
        await screen.getByLabel("Choose password").fill(admin.password);
        await screen.getByRole("button", "Next step").tap();

        // Installing runs every app's installer against a cold API.
        await screen.getByRole("button", "Start using Webiny").tap({ timeout: 180_000 });

        await screen.getByLabel("Email").fill(admin.username);
        await screen.getByLabel("Password").fill(admin.password);
        await screen.getByRole("button", "Submit").tap();

        await expect(screen.getByLabel("Password")).toBeHidden({ timeout: 30_000 });
        await expect(browser).toHaveTitle(/Welcome!/);
    }
);
