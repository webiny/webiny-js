import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerdaccioRelease } from "../src/VerdaccioRelease";

vi.mock("execa", () => ({
    default: vi.fn().mockResolvedValue({ stdout: "def5678" })
}));

const logger = {
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
};

describe("VerdaccioRelease.computeVersion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should generate version from commit hash with local-npm tag", async () => {
        const release = new VerdaccioRelease(logger);
        const version = await release.computeVersion();
        expect(version).toBe("0.0.0-local-npm.def5678");
    });

    it("should use custom tag in version", async () => {
        const release = new VerdaccioRelease(logger);
        release.setTag("custom-local");
        const version = await release.computeVersion();
        expect(version).toBe("0.0.0-custom-local.def5678");
    });
});

describe("VerdaccioRelease.setVersion", () => {
    it("should throw when --version is passed", () => {
        const release = new VerdaccioRelease(logger);
        expect(() => release.setVersion("6.4.0")).toThrow(
            '"--version" is not allowed for verdaccio releases.'
        );
    });
});
