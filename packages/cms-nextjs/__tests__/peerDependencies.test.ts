import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import semver from "semver";

describe("@webiny/cms-nextjs peerDependencies", () => {
    it("declares the expected peer dependency range for Next.js", () => {
        const pkgJsonPath = path.resolve(import.meta.dirname, "../package.json");
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

        const nextRange = pkgJson.peerDependencies?.next;
        expect(nextRange).toBe(">=15.0.0 <17.0.0");

        // Next.js 15 is supported.
        expect(semver.satisfies("15.0.0", nextRange)).toBe(true);
        expect(semver.satisfies("15.1.0", nextRange)).toBe(true);
        expect(semver.satisfies("15.4.2", nextRange)).toBe(true);

        // Next.js 16 is supported.
        expect(semver.satisfies("16.0.0", nextRange)).toBe(true);
        expect(semver.satisfies("16.4.3", nextRange)).toBe(true);

        // Previous and future major versions are rejected.
        expect(semver.satisfies("14.2.20", nextRange)).toBe(false);
        expect(semver.satisfies("17.0.0", nextRange)).toBe(false);
    });

    it("preserves React 19 peer dependency", () => {
        const pkgJsonPath = path.resolve(import.meta.dirname, "../package.json");
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

        const reactRange = pkgJson.peerDependencies?.react;
        expect(reactRange).toBe(">=19.0.0 <20.0.0");
        expect(semver.satisfies("19.0.0", reactRange)).toBe(true);
        expect(semver.satisfies("19.3.1", reactRange)).toBe(true);
    });
});
