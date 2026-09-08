import { describe, it, expect } from "vitest";
import CapabilitiesHandler from "~/api/features/Capabilities/CapabilitiesHandler.js";
import type { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";

/**
 * The handler takes no dependencies, so instantiating the registered implementation directly is
 * enough and avoids standing up a container for a pure mapper.
 */
const handler = new (CapabilitiesHandler as unknown as {
    new (): AiPowerUpsSettingsGroupHandler.Interface;
})();

describe("CapabilitiesHandler", () => {
    /*
     * The admin form sends `null` for a field nobody has touched, and every field in an override is
     * untouched by default. The first version of this schema required strings, so saving the
     * settings screen without configuring a single capability failed with four copies of
     * "Invalid input: expected string, received null" and no indication of which section was at
     * fault.
     */
    it("accepts the nulls the form sends for untouched fields", () => {
        const result = handler.inputSchema.safeParse({
            overrides: {
                "cms.generateEntry": {
                    roleId: null,
                    connectionId: null,
                    model: null,
                    additionalInstructions: null,
                    replacePrompt: null,
                    guidance: null
                }
            }
        });

        expect(result.success).toBe(true);
    });

    it("accepts a fully configured override", () => {
        const result = handler.inputSchema.safeParse({
            overrides: {
                "cms.generateEntry": {
                    roleId: "fast",
                    connectionId: "conn-1",
                    model: "anthropic/claude-haiku-4-5",
                    additionalInstructions: "Be brief.",
                    replacePrompt: true,
                    guidance: "Custom."
                }
            }
        });

        expect(result.success).toBe(true);
    });

    it("still rejects a role that does not exist", () => {
        const result = handler.inputSchema.safeParse({
            overrides: { "cms.generateEntry": { roleId: "cheapest" } }
        });

        expect(result.success).toBe(false);
    });

    it("drops an override where every field is empty", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "cms.generateEntry": {
                        roleId: null,
                        connectionId: null,
                        additionalInstructions: "   "
                    },
                    "wb.generatePage": { additionalInstructions: "Keep it short." }
                }
            },
            null
        );

        expect(Object.keys((stored as any).overrides)).toEqual(["wb.generatePage"]);
    });

    it("keeps nulls and empty strings out of a stored override", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "wb.generatePage": {
                        roleId: null,
                        connectionId: "",
                        model: null,
                        additionalInstructions: "Keep it short.",
                        replacePrompt: null
                    }
                }
            },
            null
        );

        expect((stored as any).overrides["wb.generatePage"]).toEqual({
            additionalInstructions: "Keep it short."
        });
    });

    it("round-trips an absent section to an empty override map", () => {
        expect(handler.mapFromStorage(undefined)).toEqual({ overrides: {} });
    });
});
