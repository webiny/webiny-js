import { existsSync } from "node:fs";
import { join } from "node:path";
import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";
import { anthropic } from "@ai-sdk/anthropic";

// e2e loads no .env file on its own. `e2e/.env` first, then the project root's, so a key set in
// either place works. `loadEnvFile` never overrides a variable the shell already exported.
for (const file of [join(import.meta.dirname, ".env"), join(import.meta.dirname, "../.env")]) {
    if (existsSync(file)) {
        process.loadEnvFile(file);
    }
}

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name}. Set it in e2e/.env (see e2e/example.env).`);
    }
    return value;
};

// One key drives both sides: the agent steps here, and the Anthropic connection the test saves
// into AI Power-Ups settings.
const ANTHROPIC_API_KEY = required("ANTHROPIC_API_KEY");

export default {
    targets: [
        {
            name: "admin",
            engine: web(),
            app: { url: process.env.E2E_ADMIN_URL || "https://wby3.localhost" }
        }
    ],
    agents: {
        default: {
            model: anthropic(process.env.E2E_AGENT_MODEL || "claude-sonnet-5-5"),
            context: [
                "This is the Webiny admin app.",
                "Settings screens are forms with vertical tabs on the left.",
                "Repeating sections (connections, roles) are accordions: click the row title to expand it.",
                "Selects open a dropdown; pick the option by its visible label."
            ].join(" ")
        }
    },
    credentials: {
        admin: {
            // Defaults match the local dev instance's seeded admin.
            username: process.env.E2E_ADMIN_EMAIL || "admin@webiny.com",
            password: process.env.E2E_ADMIN_PASSWORD || "12345678"
        }
    },
    secrets: {
        "anthropic-api-key": ANTHROPIC_API_KEY
    },
    // AI enrichment runs as a background task after upload, so tests here wait on real model calls.
    timeout: 300_000,
    assertionTimeout: 10_000
} satisfies E2EConfig;
