import { createHash } from "node:crypto";
import { copyFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";
import { describe } from "@e2e-dev/web";
import { test } from "@e2e-dev/web";
import { expect } from "e2e";

const FIXTURE = "fixtures/sample.jpeg";

const MAKE_PRIVATE = `mutation MakePrivate($id: ID!) {
    fileManager {
        updateFile(id: $id, data: { accessControl: { type: "private-authenticated" } }) {
            data { accessControl { type } }
            error { message }
        }
    }
}`;

const sha256 = (bytes: ArrayBuffer) => {
    const buffer = Buffer.from(bytes);
    return createHash("sha256").update(buffer).digest("hex");
};

/*
 * A private file (access set to `private-authenticated`) is served from `/private/<key>`. A request
 * for it at `/files/<key>` is redirected there, and only a request that carries a sign-in token gets
 * the bytes.
 *
 * The requests are made from the test, not the page, so each one carries exactly the token the test
 * gives it. The token is the one the admin sends on its own GraphQL calls, read off those calls, so
 * this works with whichever identity provider the project uses.
 *
 * It is sent as `X-Webiny-Authorization`: on AWS, CloudFront signs requests to the file delivery
 * function in `Authorization`, so a viewer's token only reaches it in this header.
 *
 * `wcp`: private files only exist on a licensed project.
 */
describe(
    "a private file is delivered only to a signed-in user",
    { serial: true, session: "admin", tags: ["wcp", "file-manager"] },
    () => {
        // Fresh per run, so earlier runs' files never match.
        const fileName = `e2e-private-${Date.now()}.jpeg`;
        const fixtureBytes = readFileSync(FIXTURE);
        const expectedSha256 = createHash("sha256").update(fixtureBytes).digest("hex");

        let token = "";
        let fileUrl = "";
        let privateUrl = "";

        test("the uploaded file is made private", async ({ app, screen, browser }) => {
            await browser.route(/\/graphql/, async route => {
                const headers = route.request.headers;
                const authorization = headers["authorization"] ?? headers["Authorization"];
                if (authorization) {
                    token = authorization.replace(/^Bearer\s+/i, "");
                }
                await route.continue();
            });

            mkdirSync(".e2e/uploads", { recursive: true });
            copyFileSync(FIXTURE, `.e2e/uploads/${fileName}`);

            await app.open("/file-manager");
            await browser
                .locator('input[type="file"]')
                .first()
                .setInputFiles(`.e2e/uploads/${fileName}`);
            await expect(screen.getByText(fileName).first()).toBeVisible({ timeout: 60_000 });
            expect(token).toBeTruthy();

            // The card's thumbnail is the file's delivery URL with resize parameters.
            const thumbnail = await browser.evaluate((name: string) => {
                const image = [...document.images].find(img => {
                    return img.alt === name || img.src.includes(name);
                });
                return image?.src ?? null;
            }, fileName);
            expect(thumbnail).toBeTruthy();
            fileUrl = thumbnail!.split("?")[0];
            privateUrl = fileUrl.replace("/files/", "/private/");

            const [apiUrl, key] = fileUrl.split("/files/");
            const id = key.split("/")[0];
            const body = JSON.stringify({ query: MAKE_PRIVATE, variables: { id } });
            const response = await fetch(`${apiUrl}/graphql`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${token}`
                },
                body
            });
            const result = await response.json();
            const updateFile = result.data.fileManager.updateFile;

            expect(updateFile.error).toBeNull();
            expect(updateFile.data.accessControl.type).toBe("private-authenticated");
        });

        test("/files/ redirects to /private/ and keeps ?original", async () => {
            const response = await fetch(`${fileUrl}?original`, { redirect: "manual" });
            const location = response.headers.get("location") ?? "";

            expect(response.status).toBe(301);
            /*
             * A bare `?original` comes back as `?original=`, which still means the original. Only the
             * part from `/private/` on is compared: the location is the path the API saw, which lacks
             * any prefix a proxy in front of the API adds (the local dev proxy serves it under `/api`).
             */
            const key = fileUrl.split("/files/")[1];
            expect(location.endsWith(`/private/${key}?original=`)).toBe(true);
        });

        test("/private/ refuses a request without a token", async () => {
            const response = await fetch(`${privateUrl}?original`);

            expect(response.status).toBe(403);
        });

        test("/private/ serves the file byte for byte with a token", async () => {
            const response = await fetch(`${privateUrl}?original`, {
                headers: { "x-webiny-authorization": token }
            });
            const body = await response.arrayBuffer();

            expect(response.status).toBe(200);
            expect(sha256(body)).toBe(expectedSha256);
        });
    }
);
