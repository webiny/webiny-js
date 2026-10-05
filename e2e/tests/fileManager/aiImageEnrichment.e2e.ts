import { copyFileSync, mkdirSync } from "node:fs";
import { describe, test } from "@e2e-dev/web";
import { expect, secrets, unique } from "e2e";
import { z } from "zod";

const CONNECTION_NAME = "E2E Anthropic";
// Which entry to pick in the Vision role's Model select. Matched by the agent against the visible
// labels, so a family name is enough.
const VISION_MODEL = process.env.E2E_VISION_MODEL || "the newest Claude Sonnet model";

// `wcp`: AI Power-Ups only exists on a licensed project. `ai`: makes real model calls.
describe(
    "file manager AI image enrichment",
    { serial: true, session: "admin", tags: ["wcp", "ai", "file-manager"] },
    () => {
        test("an Anthropic connection runs the Vision role", async ({ app, agent, screen }) => {
            await app.open("/settings/ai-powerups");
            await expect(screen.getByRole("button", "Save Settings")).toBeVisible();

            await agent.act(
                [
                    "Open the Connections tab.",
                    "Make sure a connection named {name} exists, with Vendor set to Anthropic and API Key set to {apiKey}.",
                    'If it is missing, add it with "Add connection". If it already exists, replace its API Key.'
                ].join(" "),
                { params: { name: CONNECTION_NAME, apiKey: secrets.get("anthropic-api-key") } }
            );

            // Image enrichment's capability defaults to the Vision role, and that role has no
            // fallback: left empty, enrichment refuses to run.
            await agent.act(
                "Open the Model roles tab. Under Vision, set Connection to {name}, then set Model to {model}.",
                { params: { name: CONNECTION_NAME, model: VISION_MODEL } }
            );

            await screen.getByRole("button", "Save Settings").tap();
            await expect(
                screen.getByText("AI power-ups settings saved successfully!")
            ).toBeVisible();
        });

        test("an uploaded image gets AI tags and a description", async ({
            app,
            agent,
            screen,
            browser
        }) => {
            // A fresh name per run, so the file is easy to find among earlier uploads.
            const fileName = `e2e-enrichment-${Date.now()}.jpeg`;
            mkdirSync(".e2e/uploads", { recursive: true });
            copyFileSync("fixtures/sample.jpeg", `.e2e/uploads/${fileName}`);

            await app.open("/file-manager");
            await browser
                .locator('input[type="file"]')
                .first()
                .setInputFiles(`.e2e/uploads/${fileName}`);

            // Pushed over the websocket by the enrichment task once tags and description are saved.
            await expect(screen.getByText("Image enriched")).toBeVisible({ timeout: 180_000 });

            await agent.act("Open the details of the file named {fileName}.", {
                params: { fileName: unique(fileName) }
            });

            const details = await agent.extract(
                "the Description field's value and every tag in the Tags field of the open file details",
                { schema: z.object({ description: z.string(), tags: z.array(z.string()) }) }
            );

            expect(details.description.trim()).not.toBe("");
            expect(details.tags.length).toBeGreaterThan(0);
        });
    }
);
