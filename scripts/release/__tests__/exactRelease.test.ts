import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExactRelease } from "../src/ExactRelease.js";
import { getReleaseType } from "../src/releaseTypes.js";

const logger = {
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
};

describe("ExactRelease", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should be registered as the `release` type", () => {
        expect(getReleaseType("release")).toBe(ExactRelease);
        expect(ExactRelease.allowPrereleaseVersion).toBe(true);
    });

    it("should throw when --version is not set", async () => {
        const release = new ExactRelease(logger);
        await expect(release.computeVersion()).rejects.toThrow(
            '"--version" is required for exact releases.'
        );
    });

    it("should use the prerelease version verbatim", async () => {
        const release = new ExactRelease(logger);
        release.setVersion("6.4.12-beta.6");
        release.setTag("patch");
        expect(await release.computeVersion()).toBe("6.4.12-beta.6");
        expect(release.distTag).toBe("patch");
    });

    it("should use a clean version verbatim", async () => {
        const release = new ExactRelease(logger);
        release.setVersion("6.4.12");
        expect(await release.computeVersion()).toBe("6.4.12");
    });

    it("should require --tag", async () => {
        const release = new ExactRelease(logger);
        release.setVersion("6.4.12-beta.6");
        await expect(release.execute()).rejects.toThrow('"--tag" is required for exact releases.');
    });

    it("should not create a GitHub release by default", () => {
        const release = new ExactRelease(logger);
        expect(release.createGithubRelease.isEnabled()).toBe(false);
    });
});
