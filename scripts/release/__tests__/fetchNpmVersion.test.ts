import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

vi.mock("execa", () => ({
    execa: vi.fn().mockResolvedValue({ stdout: "https://registry.npmjs.org/" })
}));

import { getAnchorPackageName, fetchNpmDistTags } from "../src/fetchNpmVersion";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

let tmpDir: string;

function writeAnchorPackage(pkgJson: Record<string, any>) {
    const dir = path.join(tmpDir, "packages", "webiny");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkgJson, null, 2));
}

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webiny-anchor-"));
    vi.clearAllMocks();
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
});

describe("getAnchorPackageName", () => {
    it("should read the name from the anchor package on disk", () => {
        writeAnchorPackage({ name: "webiny", version: "0.0.0" });
        expect(getAnchorPackageName(tmpDir)).toBe("webiny");
    });

    it("should follow a rename of the anchor package", () => {
        writeAnchorPackage({ name: "@webiny/renamed", version: "0.0.0" });
        expect(getAnchorPackageName(tmpDir)).toBe("@webiny/renamed");
    });

    // This is the regression that broke the alpha release: "@webiny/cli" was removed from the
    // monorepo, its dist-tags froze, and every prerelease after that recomputed "-alpha.0".
    it("should throw when the anchor package has been removed from the monorepo", () => {
        expect(() => getAnchorPackageName(tmpDir)).toThrow(
            /Version anchor package "packages\/webiny" does not exist/
        );
    });

    it("should throw when the anchor package is private", () => {
        writeAnchorPackage({ name: "webiny", version: "0.0.0", private: true });
        expect(() => getAnchorPackageName(tmpDir)).toThrow(/is private/);
    });

    it("should throw when the anchor package has no name", () => {
        writeAnchorPackage({ version: "0.0.0" });
        expect(() => getAnchorPackageName(tmpDir)).toThrow(/has no "name"/);
    });

    it("should resolve against this repository", () => {
        expect(getAnchorPackageName(REPO_ROOT)).toBe("webiny");
    });
});

describe("fetchNpmDistTags", () => {
    beforeEach(() => {
        process.chdir(tmpDir);
    });

    afterEach(() => {
        process.chdir(REPO_ROOT);
    });

    it("should return the anchor package's dist-tags", async () => {
        writeAnchorPackage({ name: "webiny", version: "0.0.0" });
        const distTags = { latest: "6.4.11", alpha: "6.6.0-alpha.0" };
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ "dist-tags": distTags })
            })
        );

        expect(await fetchNpmDistTags()).toEqual(distTags);
        expect(fetch).toHaveBeenCalledWith("https://registry.npmjs.org/webiny");
    });

    it("should encode the scope separator in the registry URL", async () => {
        writeAnchorPackage({ name: "@webiny/cli-core", version: "0.0.0" });
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ "dist-tags": {} })
            })
        );

        await fetchNpmDistTags();
        expect(fetch).toHaveBeenCalledWith("https://registry.npmjs.org/@webiny%2fcli-core");
    });

    it("should not retry when the anchor package is not published", async () => {
        writeAnchorPackage({ name: "webiny", version: "0.0.0" });
        const mockedFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
        vi.stubGlobal("fetch", mockedFetch);

        await expect(fetchNpmDistTags()).rejects.toThrow(/is not published/);
        expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw when the registry returns no dist-tags", async () => {
        writeAnchorPackage({ name: "webiny", version: "0.0.0" });
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
        );

        await expect(fetchNpmDistTags({ retries: 0 })).rejects.toThrow(/no "dist-tags"/);
    });

    it("should retry a failing registry", async () => {
        writeAnchorPackage({ name: "webiny", version: "0.0.0" });
        const distTags = { latest: "6.4.11" };
        const mockedFetch = vi
            .fn()
            .mockResolvedValueOnce({ ok: false, status: 503, statusText: "Service Unavailable" })
            .mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ "dist-tags": distTags })
            });
        vi.stubGlobal("fetch", mockedFetch);

        expect(await fetchNpmDistTags({ minTimeout: 0 })).toEqual(distTags);
        expect(mockedFetch).toHaveBeenCalledTimes(2);
    });
});
