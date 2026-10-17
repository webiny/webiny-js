import { existsSync } from "node:fs";
import { join } from "node:path";
import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";

// e2e loads no .env file on its own. `e2e/.env` first, then the project root's, so a value set in
// either place works. `loadEnvFile` never overrides a variable the shell already exported.
for (const file of [join(import.meta.dirname, ".env"), join(import.meta.dirname, "../.env")]) {
    if (existsSync(file)) {
        process.loadEnvFile(file);
    }
}

export default {
    targets: [
        {
            name: "admin",
            engine: web(),
            app: { url: process.env.E2E_ADMIN_URL || "https://wby3.localhost" }
        }
    ],
    credentials: {
        admin: {
            // Defaults match the local dev instance's seeded admin.
            username: process.env.E2E_ADMIN_EMAIL || "admin@webiny.com",
            password: process.env.E2E_ADMIN_PASSWORD || "12345678"
        }
    },
    // The installation test alone can wait three minutes for the installers to finish, so the
    // framework's 120 second default per test is too short.
    timeout: 300_000,
    assertionTimeout: 10_000
} satisfies E2EConfig;
