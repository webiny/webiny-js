import { test } from "@e2e-dev/web";
import { credentials, expect } from "e2e";

test.setup("sign in as admin", { sessions: ["admin"] }, async ({ app, screen, session }) => {
    const admin = credentials.user("admin");

    await app.open("/");
    await screen.getByLabel("Email").fill(admin.username);
    await screen.getByLabel("Password").fill(admin.password);
    await screen.getByRole("button", "Submit").tap();

    // The sign-in form is replaced by the admin shell once the session is established.
    await expect(screen.getByLabel("Password")).toBeHidden({ timeout: 30_000 });

    await session.save("admin");
});
