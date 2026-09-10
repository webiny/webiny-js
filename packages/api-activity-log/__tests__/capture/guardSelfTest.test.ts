import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractRequiredTokens } from "./extractRequiredTokens.js";

/**
 * Guard 4 guarding itself.
 *
 * The fixture holds a known number of tokens and, deliberately, bait: identifiers placed after the
 * last dependency array that an over-greedy match would report. A regex change that reintroduces
 * the over-match fails here rather than in someone's next run, where it would show up as a wall
 * of false offenders in an unrelated feature.
 */

const fixture = () =>
    readFileSync(join(import.meta.dirname, "__fixtures__/dependencyFixture.txt"), "utf8");

describe("extractRequiredTokens", () => {
    it("finds exactly the non-optional tokens", () => {
        expect(extractRequiredTokens(fixture())).toEqual([
            "AlphaToken",
            "BetaToken",
            "DeltaToken",
            "AlphaToken"
        ]);
    });

    it("finds exactly four, so a count change is caught even if names shift", () => {
        expect(extractRequiredTokens(fixture())).toHaveLength(4);
    });

    it("excludes a dependency declared optional", () => {
        expect(extractRequiredTokens(fixture())).not.toContain("GammaOptional");
    });

    it("does not run past a dependency array into the rest of the file", () => {
        const tokens = extractRequiredTokens(fixture());

        // The bait: all of these sit after the last dependency array in the fixture.
        for (const bait of [
            "BaitTargetType",
            "BaitErrorResponse",
            "BaitListResponse",
            "BaitMapper"
        ]) {
            expect(tokens).not.toContain(bait);
        }
    });

    it("ignores an empty dependency array", () => {
        expect(extractRequiredTokens("dependencies: []")).toEqual([]);
    });

    it("finds nothing in a file with no dependency arrays", () => {
        expect(extractRequiredTokens("const x = [Alpha, Beta];")).toEqual([]);
    });

    it("handles several arrays in one file", () => {
        const source = "dependencies: [One]\nfoo\ndependencies: [Two, Three]";

        expect(extractRequiredTokens(source)).toEqual(["One", "Two", "Three"]);
    });

    it("keeps a token that merely mentions optional without declaring it", () => {
        // `optional: false` is still a required dependency.
        const source = "dependencies: [[Alpha, { optional: false }]]";

        expect(extractRequiredTokens(source)).toContain("Alpha");
    });
});
