import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlphaRelease } from "../src/AlphaRelease";

const logger = {
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
};

function createRelease(npmDistTags: Record<string, string> = {}) {
    const release = new AlphaRelease(logger);
    vi.spyOn(release as any, "fetchDistTags").mockResolvedValue(npmDistTags);
    return release;
}

describe("AlphaRelease", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should default to the 'alpha' dist-tag", () => {
        const release = new AlphaRelease(logger);
        expect(release.distTag).toBe("alpha");
    });

    it("should throw when --version is not set", async () => {
        const release = createRelease();
        await expect(release.computeVersion()).rejects.toThrow(
            '"--version" is required for alpha releases.'
        );
    });

    it("should start at .0 when no alpha tag exists on NPM", async () => {
        const release = createRelease({});
        release.version = "6.6.0";
        expect(await release.computeVersion()).toBe("6.6.0-alpha.0");
    });

    it("should increment suffix when base version matches NPM", async () => {
        const release = createRelease({ alpha: "6.6.0-alpha.3" });
        release.version = "6.6.0";
        expect(await release.computeVersion()).toBe("6.6.0-alpha.4");
    });

    it("should start at .0 when base version differs from NPM", async () => {
        const release = createRelease({ alpha: "6.5.0-alpha.5" });
        release.version = "6.6.0";
        expect(await release.computeVersion()).toBe("6.6.0-alpha.0");
    });

    it("should use --preid over the 'alpha' tag for the version string", async () => {
        const release = createRelease({});
        release.version = "6.6.0";
        release.setPreid("rc");
        expect(await release.computeVersion()).toBe("6.6.0-rc.0");
    });
});
