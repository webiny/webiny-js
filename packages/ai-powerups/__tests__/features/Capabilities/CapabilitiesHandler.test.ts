import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import CapabilitiesHandler from "~/api/features/Capabilities/CapabilitiesHandler.js";
import { AiCapability } from "~/api/features/Capabilities/abstractions.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";

const OUR_PROMPT = "Webiny's own comparison prompt.";

/** Mirrors the real capability: fixed prompt, so the replace switch is offered. */
class ComparisonCapability implements AiCapability.Interface {
    readonly id = "cms.compareEntryRevisions";
    readonly label = "CMS revision comparison";
    readonly description = "For tests.";
    readonly defaultRole = "fast" as const;
    readonly guidance = OUR_PROMPT;
}

/** Prompt assembled per request, so no replaceable guidance. */
class EntryCapability implements AiCapability.Interface {
    readonly id = "cms.generateEntry";
    readonly label = "CMS entry generation";
    readonly description = "For tests.";
    readonly defaultRole = "standard" as const;
}

function buildHandler(): AiPowerUpsSettingsGroupHandler.Interface {
    const container = new Container();
    container.register(
        AiCapability.createImplementation({
            implementation: ComparisonCapability,
            dependencies: []
        })
    );
    container.register(
        AiCapability.createImplementation({ implementation: EntryCapability, dependencies: [] })
    );
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
     * what you are about to edit. That default comes back on every save, and persisting it would
     * freeze the prompt: flip the switch a year later and you get whatever shipped the day the row
     * was written, which is the trap append-by-default exists to avoid.
     */
    it("discards a prompt that is a verbatim copy of ours", async () => {
        const stored = await handler.mapToStorage(
            { overrides: { "cms.compareEntryRevisions": { guidance: OUR_PROMPT } } },
            null
        );

        expect((stored as any).overrides).toEqual({});
    });

    it("discards our prompt even when the switch is on, since it tracks ours anyway", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "cms.compareEntryRevisions": { replacePrompt: true, guidance: OUR_PROMPT }
                }
            },
            null
        );

        expect((stored as any).overrides["cms.compareEntryRevisions"]).toEqual({
            replacePrompt: true
        });
    });

    /*
     * The test is content, not the switch. Keying off the switch looked equivalent and was not: it
     * threw away a prompt somebody had actually written the moment they toggled the switch off and
     * saved, so toggling was lossy.
     */
    it("keeps a prompt the project wrote, even with the switch off", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "cms.compareEntryRevisions": {
                        replacePrompt: false,
                        guidance: "Our own house prompt."
                    }
                }
            },
            null
        );

        expect((stored as any).overrides["cms.compareEntryRevisions"]).toEqual({
            guidance: "Our own house prompt."
        });
    });

    it("keeps a prompt for a capability that declares none of its own", async () => {
        const stored = await handler.mapToStorage(
            { overrides: { "cms.generateEntry": { guidance: "Something." } } },
            null
        );

        expect((stored as any).overrides["cms.generateEntry"]).toEqual({
            guidance: "Something."
        });
    });

    it("keeps the rest of a row when only the echoed prompt is discarded", async () => {
        const stored = await handler.mapToStorage(
            {
                overrides: {
                    "cms.compareEntryRevisions": {
                        additionalInstructions: "Never translate product names.",
                        guidance: OUR_PROMPT
                    }
                }
            },
            null
        );

        expect((stored as any).overrides["cms.compareEntryRevisions"]).toEqual({
            additionalInstructions: "Never translate product names."
        });
    });

    it("round-trips an absent section to an empty override map", () => {
        expect(handler.mapFromStorage(undefined)).toEqual({ overrides: {} });
    });
});
