import { createHash } from "node:crypto";
import { copyFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";
import { describe } from "@e2e-dev/web";
import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import type { App } from "e2e";
import type { Screen } from "e2e";

const FIXTURE = "fixtures/sample.jpeg";

/*
 * Each load of the file manager fetches the list once. With OpenSearch (DDB+OS) a new file is
 * listed only after it has been indexed, which can take longer than a load, so waiting on one page
 * can miss it for good. This loads the page again until the file is listed.
 */
const LIST_TIMEOUT = 90_000;
const PER_LOAD_TIMEOUT = 10_000;

const expectListedAfterLoad = async (app: App, screen: Screen, fileName: string) => {
    const isListedAfterLoad = async () => {
        await app.open("/file-manager");
        try {
            await screen.getByText(fileName).first().waitFor({ timeout: PER_LOAD_TIMEOUT });
            return true;
        } catch {
            return false;
        }
    };
    await expect
        .poll(isListedAfterLoad, {
            timeout: LIST_TIMEOUT,
            interval: 1_000,
            message: `${fileName} was not listed in the file manager after reloading it`
        })
        .toBe(true);
};

/*
 * No tags and no agent steps, so it runs in every variant, unlicensed ones included. With several
 * API processes behind a load balancer, the upload, the list after a reload and the delivery each
 * go to whichever process the balancer picks, so this checks that a file written through one
 * process is listed and served by the others.
 */
describe(
    "a file uploaded in the file manager is listed and delivered",
    {
        serial: true,
        session: "admin",
        tags: ["file-manager"]
    },
    () => {
        // Fresh per run, so earlier runs' files never match.
        const fileName = `e2e-upload-${Date.now()}.jpeg`;

        test("the uploaded file is still listed after a reload", async ({
            app,
            screen,
            browser
        }) => {
            mkdirSync(".e2e/uploads", { recursive: true });
            copyFileSync(FIXTURE, `.e2e/uploads/${fileName}`);

            await app.open("/file-manager");
            await browser
                .locator('input[type="file"]')
                .first()
                .setInputFiles(`.e2e/uploads/${fileName}`);
            await expect(screen.getByText(fileName).first()).toBeVisible({ timeout: 60_000 });

            // A fresh load lists the files from the API again, not from the state the upload left.
            await expectListedAfterLoad(app, screen, fileName);
        });

        test("the uploaded file downloads byte for byte", async ({ app, screen, browser }) => {
            await expectListedAfterLoad(app, screen, fileName);

            /*
             * The card's thumbnail is the file's delivery URL with resize parameters. Dropping them and
             * asking for `?original` serves the uploaded bytes unchanged.
             */
            const thumbnail = await browser.evaluate((name: string) => {
                const image = [...document.images].find(img => {
                    return img.alt === name || img.src.includes(name);
                });
                return image?.src ?? null;
            }, fileName);
            expect(thumbnail).toBeTruthy();
            const originalUrl = `${thumbnail!.split("?")[0]}?original`;

            // Read from the file's own origin, so an API on another port needs no CORS for this.
            await browser.goto(originalUrl);
            const delivered = await browser.evaluate(async () => {
                const response = await fetch(location.href);
                const body = await response.arrayBuffer();
                const digest = await crypto.subtle.digest("SHA-256", body);
                return {
                    status: response.status,
                    sha256: [...new Uint8Array(digest)]
                        .map(byte => byte.toString(16).padStart(2, "0"))
                        .join("")
                };
            });

            const fixtureBytes = readFileSync(FIXTURE);
            const expectedSha256 = createHash("sha256").update(fixtureBytes).digest("hex");
            expect(delivered.status).toBe(200);
            expect(delivered.sha256).toBe(expectedSha256);
        });
    }
);
