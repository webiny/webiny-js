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

function createRelease(npmDistTags: Record<string, string> = {}, publishedVersions: string[] = []) {
    const release = new LatestRelease(logger);
    vi.spyOn(release as any, "fetchDistTags").mockResolvedValue(npmDistTags);
    vi.spyOn(release as any, "fetchPublishedVersions").mockResolvedValue(publishedVersions);
    return release;
}

describe("LatestRelease.computeVersion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return the exact version passed", async () => {
        const release = createRelease({ latest: "6.3.0" });
        release.version = "6.4.0";
        expect(await release.computeVersion()).toBe("6.4.0");
        expect(release.distTag).toBe("latest");
        expect(release.createGithubRelease.isLatest()).toBe(true);
    });

    it("should keep the latest tag when nothing is published yet", async () => {
        const release = createRelease({});
        release.version = "6.4.0";
        await release.computeVersion();
        expect(release.distTag).toBe("latest");
    });

    it("should put a patch for an older line under that line's tag", async () => {
        const release = createRelease({ latest: "6.5.0" }, ["6.4.11", "6.4.12", "6.5.0"]);
        release.version = "6.4.13";
        expect(await release.computeVersion()).toBe("6.4.13");
        expect(release.distTag).toBe("latest-6.4");
    });

    it("should not mark a patch for an older line as the latest GitHub release", async () => {
        const release = createRelease({ latest: "6.5.0" });
        release.version = "6.4.13";
        await release.computeVersion();
        expect(release.createGithubRelease.isEnabled()).toBe(true);
        expect(release.createGithubRelease.isLatest()).toBe(false);
    });

    it("should diff a patch for an older line against that line's previous release", async () => {
        const release = createRelease({ latest: "6.5.0" }, [
            "6.4.11",
            "6.4.12",
            "6.4.13-beta.0",
            "6.5.0"
        ]);
        release.version = "6.4.13";
        await release.computeVersion();
        expect(await (release as any).findPreviousRelease()).toBe("6.4.12");
    });

    it("should diff a regular release against the current latest", async () => {
        const release = createRelease({ latest: "6.4.11" }, ["6.4.11"]);
        release.version = "6.5.0";
        await release.computeVersion();
        expect(await (release as any).findPreviousRelease()).toBe("6.4.11");
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
