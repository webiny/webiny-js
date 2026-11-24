import type { Browser } from "@e2e-dev/web";
import type { App, Screen } from "e2e";
import { secrets } from "e2e";
import { captureApiSession, waitForApiSession } from "./apiSession.ts";
import type { ApiSession } from "./apiSession.ts";
import type { TestUser } from "./adminUser.ts";

/** The fixtures a sign-in drives. */
export interface SignInFixtures {
    app: App;
    screen: Screen;
    browser: Browser;
}

/** The name of the secret `e2e.config.ts` makes per run: every test user's password. */
const PASSWORD_SECRET = "workflows-user-password";

/**
 * The password of every user the tests create, for the API call that creates them. `e2e.config.ts`
 * makes it per run and hands it to the workers through the environment. Never print it.
 */
export const readTestUserPassword = (): string => {
    const password = process.env.E2E_WORKFLOWS_USER_PASSWORD;
    if (!password) {
        throw new Error("E2E_WORKFLOWS_USER_PASSWORD is unset; e2e.config.ts sets it per run.");
    }
    return password;
};

/**
 * Signs the browser out and signs `user` in through the admin's sign-in form, then returns the API
 * session of that user, read off the admin's own requests. Both identity providers keep the session
 * in localStorage (Cognito through Amplify, self-hosted auth under its own key), so clearing it
 * signs out. It is cleared on `robots.txt`, a static file of the project's public folder, never
 * under a running admin, whose requests in flight would then fail without a token. sessionStorage,
 * where the page-error check records, is kept. The password is filled from the run's secret, so
 * reports and traces show `<secret:workflows-user-password>`.
 */
export const signInAs = async (fixtures: SignInFixtures, user: TestUser): Promise<ApiSession> => {
    const { app, screen, browser } = fixtures;

    await app.open("/robots.txt");
    await browser.evaluate(() => {
        window.localStorage.clear();
        return null;
    });
    await browser.clearCookies();
    // A session captured earlier in the test stops reading tokens.
    await browser.unrouteAll();
    const captured = await captureApiSession(browser);

    await app.open("/");
    await screen.getByLabel("Email").fill(user.email);
    await screen.getByLabel("Password").fill(secrets.get(PASSWORD_SECRET));
    await screen.getByRole("button", "Submit").tap();

    // The sign-in form is replaced by the admin shell once the session is established.
    await screen.getByLabel("Password").waitFor({ state: "hidden", timeout: 30_000 });
    return waitForApiSession(captured);
};
