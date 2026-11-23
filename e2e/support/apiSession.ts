import type { Browser } from "@e2e-dev/web";

/**
 * Where the admin's API is and the token it signs its requests with, both read off the admin's own
 * GraphQL calls, so the tests call the API as the signed-in user with whichever identity provider
 * the project uses.
 */
export interface ApiSession {
    /** The API's base URL, without the `/graphql` path. */
    apiUrl: string;
    token: string;
}

const GRAPHQL_PATH = /\/graphql(\?.*)?$/;

/**
 * Starts reading the token and API URL off every GraphQL request the admin makes. The returned
 * session fills in on the admin's first signed request after a page load.
 */
export const captureApiSession = async (browser: Browser): Promise<ApiSession> => {
    const session: ApiSession = { apiUrl: "", token: "" };

    await browser.route(/\/graphql/, async route => {
        const headers = route.request.headers;
        const authorization = headers["authorization"] ?? headers["Authorization"];
        if (authorization && GRAPHQL_PATH.test(route.request.url)) {
            session.token = authorization.replace(/^Bearer\s+/i, "");
            session.apiUrl = route.request.url.replace(GRAPHQL_PATH, "");
        }
        await route.continue();
    });

    return session;
};

/** Resolves once the admin has sent a signed GraphQL request, or throws after `timeoutMs`. */
export const waitForApiSession = async (session: ApiSession, timeoutMs = 30_000) => {
    const deadline = Date.now() + timeoutMs;
    while (!session.token || !session.apiUrl) {
        if (Date.now() > deadline) {
            throw new Error("The admin sent no signed GraphQL request to read a token from.");
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    return session;
};
