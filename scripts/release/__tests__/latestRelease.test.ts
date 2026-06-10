import { describe, it, expect, vi, beforeEach } from "vitest";
import { LatestRelease } from "../src/LatestRelease";

const logger = {
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
};

describe("LatestRelease.computeVersion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return the exact version passed", async () => {
        const release = new LatestRelease(logger);
        release.version = "6.4.0";
        expect(await release.computeVersion()).toBe("6.4.0");
    });

    it("should throw when --version is not set", async () => {
        const release = new LatestRelease(logger);
        await expect(release.computeVersion()).rejects.toThrow(
            '"--version" is required for latest releases.'
        );
    });
});

describe("LatestRelease.setTag", () => {
    it("should reject non-latest tags", () => {
        const release = new LatestRelease(logger);
        release.setTag("beta");
        expect(release.distTag).toBe("latest");
        expect(logger.warning).toHaveBeenCalled();
    });

    it("should accept the latest tag", () => {
        const release = new LatestRelease(logger);
        release.setTag("latest");
        expect(release.distTag).toBe("latest");
    });
});
