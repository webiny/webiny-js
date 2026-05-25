import { describe, it, expect, vi, beforeEach } from "vitest";
import { BetaRelease } from "../src/BetaRelease";

const logger = {
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
};

function createRelease(npmDistTags: Record<string, string> = {}) {
    const release = new BetaRelease(logger);
    vi.spyOn(release as any, "fetchDistTags").mockResolvedValue(npmDistTags);
    return release;
}

describe("BetaRelease.computeVersion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should throw when --version is not set", async () => {
        const release = createRelease();
        await expect(release.computeVersion()).rejects.toThrow(
            '"--version" is required for beta releases.'
        );
    });

    it("should start at .0 when no beta tag exists on NPM", async () => {
        const release = createRelease({});
        release.version = "6.4.0";
        expect(await release.computeVersion()).toBe("6.4.0-beta.0");
    });

    it("should increment suffix when base version matches NPM", async () => {
        const release = createRelease({ beta: "6.4.0-beta.3" });
        release.version = "6.4.0";
        expect(await release.computeVersion()).toBe("6.4.0-beta.4");
    });

    it("should start at .0 when base version differs from NPM", async () => {
        const release = createRelease({ beta: "6.3.0-beta.5" });
        release.version = "6.4.0";
        expect(await release.computeVersion()).toBe("6.4.0-beta.0");
    });

    it("should use --tag as preid when no --preid is set", async () => {
        const release = createRelease({});
        release.version = "6.4.0";
        release.setTag("alpha");
        expect(await release.computeVersion()).toBe("6.4.0-alpha.0");
    });

    it("should use --preid over --tag for the version string", async () => {
        const release = createRelease({});
        release.version = "6.4.0";
        release.setTag("alpha");
        release.setPreid("rc");
        expect(await release.computeVersion()).toBe("6.4.0-rc.0");
    });

    it("should increment based on dist-tag, not preid", async () => {
        const release = createRelease({ alpha: "6.4.0-rc.2" });
        release.version = "6.4.0";
        release.setTag("alpha");
        release.setPreid("rc");
        expect(await release.computeVersion()).toBe("6.4.0-rc.3");
    });

    it("should handle NPM version with no numeric prerelease suffix", async () => {
        const release = createRelease({ beta: "6.4.0-beta" });
        release.version = "6.4.0";
        expect(await release.computeVersion()).toBe("6.4.0-beta.0");
    });

    it("should increment from .0", async () => {
        const release = createRelease({ beta: "6.4.0-beta.0" });
        release.version = "6.4.0";
        expect(await release.computeVersion()).toBe("6.4.0-beta.1");
    });
});
