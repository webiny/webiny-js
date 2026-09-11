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
                    additionalInstructions: null
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
                    additionalInstructions: "Be brief."
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
                        additionalInstructions: "Keep it short."
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
     * There is no prompt field here any more. Replacing a capability's prompt was offered and then
     * removed: for most capabilities the prompt carries the output contract the surrounding code
     * parses, so it is implementation rather than settings. `additionalInstructions` is the whole
     * of prompt customisation now.
     */
    it("rejects a prompt override, which is no longer a thing", () => {
        const result = handler.inputSchema.safeParse({
            overrides: { "cms.compareEntryRevisions": { guidance: "Mine now." } }
        });

        // Zod strips the unknown key rather than failing, so the check is that it never lands.
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ overrides: { "cms.compareEntryRevisions": {} } });
    });

    it("round-trips an absent section to an empty override map", () => {
        expect(handler.mapFromStorage(undefined)).toEqual({ overrides: {} });
    });
});
