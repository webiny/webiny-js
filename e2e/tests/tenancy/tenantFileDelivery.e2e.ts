import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { describe, test } from "@e2e-dev/web";
import { expect, unique } from "e2e";

const FIXTURE = "fixtures/sample.jpeg";

// `wcp`: multi-tenancy only exists on a licensed project.
describe(
    "a file uploaded in a new tenant is delivered",
    { serial: true, session: "admin", tags: ["wcp", "tenancy", "file-manager"] },
    () => {
        // Fresh per run, so earlier runs' tenants and files never match.
        const runId = Date.now();
        const tenantName = `E2E tenant ${runId}`;
        const fileName = `e2e-tenant-delivery-${runId}.jpeg`;

        test("a new tenant is created, installed and opened", async ({ app, agent, screen }) => {
            await app.open("/cms/content-entries/wbyTenant");

            await agent.act("Create a new tenant named {name} and save it.", {
                params: { name: unique(tenantName) }
            });

            // Saving a new entry leaves the form open, and the Install action lives on the list.
            // The agent can finish before the save does. Wait for its toast: the save rewrites the
            // URL client-side just before it, and a page load started earlier is aborted.
            await expect(screen.getByText(`${tenantName} saved successfully!`).first()).toBeVisible(
                {
                    timeout: 30_000
                }
            );
            await app.open("/cms/content-entries/wbyTenant");
            const row = screen.getByRole("row").filter({ hasText: tenantName });
            await row.getByRole("button", "Install").tap();

            // Installing seeds the tenant's data, which takes a while on a cold API.
            const manage = row.getByRole("button", "Manage");
            await expect(manage).toBeVisible({ timeout: 120_000 });
            await manage.tap();

            // The header's tenant selector shows the current tenant's name.
            await expect(screen.getByText(tenantName).first()).toBeVisible({ timeout: 30_000 });
        });

        test("the uploaded image downloads byte for byte", async ({
            app,
            agent,
            screen,
            browser
        }) => {
            mkdirSync(".e2e/uploads", { recursive: true });
            copyFileSync(FIXTURE, `.e2e/uploads/${fileName}`);

            await app.open("/file-manager");
            // Still in the tenant: the switch is kept in localStorage.
            await expect(screen.getByText(tenantName).first()).toBeVisible();

            await browser
                .locator('input[type="file"]')
                .first()
                .setInputFiles(`.e2e/uploads/${fileName}`);
            await expect(screen.getByText(fileName).first()).toBeVisible({ timeout: 60_000 });

            await agent.act("Open the details of the file named {fileName}.", {
                params: { fileName: unique(fileName) }
            });

            // The drawer's Download action is a link to the file's delivery URL with `?original`,
            // which serves the uploaded bytes unchanged.
            const downloadUrl = await browser.evaluate(
                () =>
                    document.querySelector<HTMLAnchorElement>('a[href$="?original"]')?.href ?? null
            );
            expect(downloadUrl).toBeTruthy();

            // Open it in this tab rather than following the link's new tab, then read the bytes from
            // the file's own origin, so an API on another port (CI) needs no CORS for this.
            await browser.goto(downloadUrl!);
            const delivered = await browser.evaluate(async () => {
                const response = await fetch(location.href);
                const digest = await crypto.subtle.digest("SHA-256", await response.arrayBuffer());
                return {
                    status: response.status,
                    contentType: response.headers.get("content-type"),
                    sha256: [...new Uint8Array(digest)]
                        .map(byte => byte.toString(16).padStart(2, "0"))
                        .join("")
                };
            });

            expect(delivered.status).toBe(200);
            expect(delivered.contentType).toContain("image/jpeg");
            expect(delivered.sha256).toBe(
                createHash("sha256").update(readFileSync(FIXTURE)).digest("hex")
            );
        });
    }
);
