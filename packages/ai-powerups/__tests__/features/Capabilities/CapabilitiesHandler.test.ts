import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import CapabilitiesHandler from "~/api/features/Capabilities/CapabilitiesHandler.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";

function buildHandler(): AiPowerUpsSettingsGroupHandler.Interface {
    const container = new Container();
    container.register(CapabilitiesHandler);

    return container.resolve(AiPowerUpsSettingsGroupHandler);
}

const handler = buildHandler();

describe("CapabilitiesHandler", () => {
    /*
     * The admin form sends `null` for a field nobody has touched, and every field in an entry is
     * untouched by default. The first version of this schema required strings, so saving the
     * settings screen without configuring a single capability failed with four copies of
     * "Invalid input: expected string, received null" and no indication of which section was at
     * fault.
     */
    it("accepts the nulls the form sends for untouched fields", () => {
        const result = handler.inputSchema.safeParse({
            items: {
                "cms.generateEntry": {
                    enabled: null,
                    overrides: {
                        roleId: null,
                        connectionId: null,
                        model: null,
                        additionalInstructions: null
                    }
                }
            }
        });

        expect(result.success).toBe(true);
    });

    it("accepts a fully configured entry", () => {
        const result = handler.inputSchema.safeParse({
            items: {
                "cms.generateEntry": {
                    enabled: false,
                    overrides: {
                        roleId: "fast",
                        connectionId: "conn-1",
                        model: "anthropic/claude-haiku-4-5",
                        additionalInstructions: "Be brief."
                    }
                }
            }
        });

        expect(result.success).toBe(true);
    });

    it("still rejects a role that does not exist", () => {
        const result = handler.inputSchema.safeParse({
            items: { "cms.generateEntry": { overrides: { roleId: "cheapest" } } }
        });

        expect(result.success).toBe(false);
    });

    /*
     * The form posts every registered capability on every save, and all of them are kept. A blob
     * that only lists the capabilities someone happened to customise reads as though the rest are
     * missing rather than simply on.
     */
    it("stores an entry for every capability the form sent", async () => {
        const stored = await handler.mapToStorage(
            {
                items: {
                    "cms.generateEntry": {
                        enabled: true,
                        overrides: {
                            roleId: null,
                            connectionId: null,
                            additionalInstructions: "  "
                        }
                    },
                    "wb.generatePage": {
                        enabled: true,
                        overrides: { additionalInstructions: "Keep it short." }
                    }
                }
            },
            null
        );

        expect((stored as any).items).toEqual({
            "cms.generateEntry": { enabled: true, overrides: {} },
            "wb.generatePage": {
                enabled: true,
                overrides: { additionalInstructions: "Keep it short." }
            }
        });
    });

    /*
     * The reason `enabled` is separated from the overrides rather than sitting alongside them.
     *
     * Switching a capability off is usually the *only* thing someone changes about it, so the entry
     * carries a meaningful `false` and four empty strings. An emptiness check that judges the whole
     * entry by its strings — or that spells the test `!entry.enabled` instead of
     * `entry.enabled !== false` — reads that as blank, drops the row, and the capability comes back
     * enabled on the next load. The switch appears to do nothing at all.
     */
    it("stores a capability that was switched off", async () => {
        const stored = await handler.mapToStorage(
            {
                items: {
                    "fm.imageEnrichment": {
                        enabled: false,
                        overrides: {
                            roleId: null,
                            connectionId: null,
                            model: null,
                            additionalInstructions: null
                        }
                    }
                }
            },
            null
        );

        expect((stored as any).items["fm.imageEnrichment"]).toEqual({
            enabled: false,
            overrides: {}
        });
    });

    /* An untouched switch can arrive as `null`, and that means on, same as absence. */
    it("settles a null switch to enabled rather than storing the null", async () => {
        const stored = await handler.mapToStorage(
            { items: { "cms.generateEntry": { enabled: null, overrides: {} } } },
            null
        );

        expect((stored as any).items["cms.generateEntry"]).toEqual({
            enabled: true,
            overrides: {}
        });
    });

    it("keeps nulls and empty strings out of a stored override", async () => {
        const stored = await handler.mapToStorage(
            {
                items: {
                    "wb.generatePage": {
                        overrides: {
                            roleId: null,
                            connectionId: "",
                            model: null,
                            additionalInstructions: "Keep it short."
                        }
                    }
                }
            },
            null
        );

        expect((stored as any).items["wb.generatePage"]).toEqual({
            enabled: true,
            overrides: { additionalInstructions: "Keep it short." }
        });
    });

    /*
     * There is no prompt field here any more. Replacing a capability's prompt was offered and then
     * removed: for most capabilities the prompt carries the output contract the surrounding code
     * parses, so it is implementation rather than settings. `additionalInstructions` is the whole
     * of prompt customisation now.
     */
    it("rejects a prompt override, which is no longer a thing", () => {
        const result = handler.inputSchema.safeParse({
            items: { "cms.compareEntryRevisions": { overrides: { guidance: "Mine now." } } }
        });

        // Zod strips the unknown key rather than failing, so the check is that it never lands.
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
            items: { "cms.compareEntryRevisions": { overrides: {} } }
        });
    });

    it("round-trips an absent section to an empty map", () => {
        expect(handler.mapFromStorage(undefined)).toEqual({ items: {} });
    });
});
