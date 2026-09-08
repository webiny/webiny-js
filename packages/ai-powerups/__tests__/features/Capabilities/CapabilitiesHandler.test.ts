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

    /*
     * The admin pre-fills the prompt textarea with our own text so flipping the switch shows you
     * what you are about to edit. That default came back on every save regardless of the switch,
     * so a project that never touched capabilities ended up storing verbatim copies of three of
     * our prompts. A stored copy is a frozen copy, which is the trap append-by-default exists to
     * avoid.
     */
    it("discards a prompt when the replace switch is off", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "cms.compareEntryRevisions": {
                        replacePrompt: false,
                        guidance: "Webiny's own prompt, echoed back by the form."
                    }
                }
            },
            null
        );

        expect((stored as any).overrides).toEqual({});
    });

    it("keeps a prompt the project has explicitly taken over", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "cms.compareEntryRevisions": {
                        replacePrompt: true,
                        guidance: "Our own house prompt."
                    }
                }
            },
            null
        );

        expect((stored as any).overrides["cms.compareEntryRevisions"]).toEqual({
            replacePrompt: true,
            guidance: "Our own house prompt."
        });
    });

    it("keeps the rest of a row when only the prompt is discarded", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "wb.translatePage": {
                        additionalInstructions: "Never translate product names.",
                        guidance: "Echoed default."
                    }
                }
            },
            null
        );

        expect((stored as any).overrides["wb.translatePage"]).toEqual({
            additionalInstructions: "Never translate product names."
        });
    });

    it("round-trips an absent section to an empty override map", () => {
        expect(handler.mapFromStorage(undefined)).toEqual({ overrides: {} });
    });
});
