import { describe, expect, it } from "vitest";
import { createDefaultThemeDocument } from "~/defaults/defaultTheme.js";
import { META_EXTENSION, type TokenDocument, type TokenGroup } from "~/dtcg/types.js";
import { createDefaultPolicy } from "~/policy/types.js";
import { createResolvedSnapshot, getSnapshotValue, ThemeNotPublishableError } from "~/snapshot.js";
import { createDefaultSettings } from "~/theme/settings.js";
import { canPublish, validateForPublish } from "./publish.js";

const settings = createDefaultSettings();

describe("validateForPublish", () => {
    it("passes the default theme with no blockers and no warnings", () => {
        const result = validateForPublish(createDefaultThemeDocument(), settings);

        expect(result.blockers).toEqual([]);
        expect(result.warnings).toEqual([]);
        expect(canPublish(result)).toBe(true);
    });

    it("blocks on a missing canonical slot", () => {
        const document = createDefaultThemeDocument();
        delete (document.color as TokenGroup).surface;

        const result = validateForPublish(document, settings);

        expect(canPublish(result)).toBe(false);
        expect(result.blockers.map(blocker => blocker.path)).toContain("color.surface.page");
        expect(result.blockers[0].code).toBe("Theme/MissingCanonicalSlot");
    });

    it("blocks on an unresolved reference and names the mode", () => {
        const document = createDefaultThemeDocument();
        const surface = (document.color as TokenGroup).surface as TokenGroup;
        surface.page = { $value: "{color.brand.does-not-exist}" };

        const result = validateForPublish(document, settings);
        const blocker = result.blockers.find(
            candidate => candidate.code === "Theme/UnresolvedReference"
        );

        expect(blocker?.path).toBe("color.surface.page");
        expect(blocker?.message).toContain("light mode");
    });

    it("blocks on a reference cycle", () => {
        const document: TokenDocument = {
            color: { $type: "color", a: { $value: "{color.b}" }, b: { $value: "{color.a}" } }
        };

        const result = validateForPublish(document, settings);
        expect(result.blockers.some(blocker => blocker.message.includes("reference cycle"))).toBe(
            true
        );
    });

    it("blocks on a fluid step that cannot produce valid CSS", () => {
        const document = createDefaultThemeDocument();
        const text = document.text as TokenGroup;
        text.xl = {
            $value: "1rem",
            $extensions: {
                [META_EXTENSION]: { fluid: { min: "2rem", max: "1rem", enabled: true } }
            }
        };

        const result = validateForPublish(document, settings);
        const blocker = result.blockers.find(
            candidate => candidate.code === "Theme/InvalidFluidStep"
        );

        expect(blocker?.path).toBe("text.xl");
    });

    it("reports a malformed document and stops rather than cascading", () => {
        const result = validateForPublish({ color: { "bad.name": { $value: "#fff" } } }, settings);

        expect(result.blockers[0].code).toBe("Theme/InvalidDocument");
        expect(result.warnings).toEqual([]);
    });

    it("reports contrast as a warning, not a blocker", () => {
        const document = createDefaultThemeDocument();
        const text = (document.color as TokenGroup).text as TokenGroup;
        text.primary = { $value: "#BBBBBB" };

        const result = validateForPublish(document, settings);

        expect(canPublish(result)).toBe(true);
        expect(result.warnings.some(warning => warning.code === "A11y/Contrast")).toBe(true);
    });

    it("reports zoom as a warning, not a blocker", () => {
        const document = createDefaultThemeDocument();
        const text = document.text as TokenGroup;
        text["3xl"] = {
            $value: "1rem",
            $extensions: {
                [META_EXTENSION]: { fluid: { min: "1rem", max: "4rem", enabled: true } }
            }
        };

        const result = validateForPublish(document, settings);

        expect(canPublish(result)).toBe(true);
        expect(result.warnings.some(warning => warning.code === "A11y/Zoom")).toBe(true);
    });
});

describe("createResolvedSnapshot", () => {
    const policy = createDefaultPolicy();
    const now = new Date("2026-08-01T10:00:00.000Z");

    it("freezes every token to a literal in both modes", () => {
        const snapshot = createResolvedSnapshot({
            document: createDefaultThemeDocument(),
            policy,
            settings,
            now
        });

        expect(snapshot.schemaVersion).toBe(1);
        expect(snapshot.resolvedAt).toBe("2026-08-01T10:00:00.000Z");
        expect(getSnapshotValue(snapshot, "light", "color.surface.page")).toBe("#F8FAFC");
        expect(getSnapshotValue(snapshot, "dark", "color.surface.page")).toBe("#0F172A");
    });

    it("leaves no aliases behind", () => {
        const snapshot = createResolvedSnapshot({
            document: createDefaultThemeDocument(),
            policy,
            settings,
            now
        });

        // Only string leaves can hold an alias — a composite value is an object, whose serialised
        // form contains braces for reasons that have nothing to do with references.
        const stringLeaves = (value: unknown): string[] => {
            if (typeof value === "string") {
                return [value];
            }
            if (Array.isArray(value)) {
                return value.flatMap(stringLeaves);
            }
            if (typeof value === "object" && value !== null) {
                return Object.values(value).flatMap(stringLeaves);
            }
            return [];
        };

        for (const mode of ["light", "dark"] as const) {
            for (const token of snapshot.modes[mode]) {
                for (const leaf of stringLeaves(token.value)) {
                    expect(leaf).not.toMatch(/^\{[^{}]+\}$/);
                }
            }
        }
    });

    it("is immune to later edits of the source document", () => {
        const document = createDefaultThemeDocument();
        const snapshot = createResolvedSnapshot({ document, policy, settings, now });

        const brand = (document.color as TokenGroup).brand as TokenGroup;
        brand["neutral-50"] = { $value: "#FF0000" };

        expect(getSnapshotValue(snapshot, "light", "color.surface.page")).toBe("#F8FAFC");
    });

    it("carries policy, settings and the warnings recorded at publish time", () => {
        const snapshot = createResolvedSnapshot({
            document: createDefaultThemeDocument(),
            policy,
            settings,
            now
        });

        expect(snapshot.policy).toEqual(policy);
        expect(snapshot.settings.viewport).toEqual(settings.viewport);
        expect(snapshot.warnings).toEqual([]);
    });

    it("refuses to snapshot a document with blockers", () => {
        const document = createDefaultThemeDocument();
        delete (document.color as TokenGroup).surface;

        expect(() => createResolvedSnapshot({ document, policy, settings, now })).toThrow(
            ThemeNotPublishableError
        );
    });
});
