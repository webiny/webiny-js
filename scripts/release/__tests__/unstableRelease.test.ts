import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnstableRelease } from "../src/UnstableRelease";

vi.mock("execa", () => ({
    default: vi.fn().mockResolvedValue({ stdout: "abc1234" })
}));

const logger = {
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
};

describe("UnstableRelease.computeVersion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should generate version from commit hash", async () => {
        const release = new UnstableRelease(logger);
        const version = await release.computeVersion();
        expect(version).toBe("0.0.0-unstable.abc1234");
    });

    it("should use custom tag in version", async () => {
        const release = new UnstableRelease(logger);
        release.setTag("nightly");
        const version = await release.computeVersion();
        expect(version).toBe("0.0.0-nightly.abc1234");
    });
});

describe("UnstableRelease.setTag", () => {
    it("should reject protected tag 'latest'", () => {
        const release = new UnstableRelease(logger);
        expect(() => release.setTag("latest")).toThrow('Protected tag "latest"');
    });

    it("should reject protected tag 'beta'", () => {
        const release = new UnstableRelease(logger);
        expect(() => release.setTag("beta")).toThrow('Protected tag "beta"');
    });

    it("should accept non-protected tags", () => {
        const release = new UnstableRelease(logger);
        release.setTag("nightly");
        expect(release.distTag).toBe("nightly");
    });
});

describe("UnstableRelease.setVersion", () => {
    it("should throw when --version is passed", () => {
        const release = new UnstableRelease(logger);
        expect(() => release.setVersion("6.4.0")).toThrow(
            '"--version" is not allowed for unstable releases.'
        );
    });
});
