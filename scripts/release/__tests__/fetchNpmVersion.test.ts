import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

vi.mock("execa", () => ({
    execa: vi.fn().mockResolvedValue({ stdout: "https://registry.npmjs.org/" })
}));

import { ANCHOR_PACKAGE, fetchNpmDistTags } from "../src/fetchNpmVersion";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function mockRegistry(response: Record<string, any>) {
    const mockedFetch = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", mockedFetch);
    return mockedFetch;
}

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// This is the regression that broke the alpha release: "@webiny/cli" was removed from the
// monorepo, its dist-tags froze, and every prerelease after that recomputed "-alpha.0".
describe("ANCHOR_PACKAGE", () => {
    it("should still be published from this repository", () => {
        const pkgJsonPath = path.join(REPO_ROOT, "packages", ANCHOR_PACKAGE, "package.json");

        expect(
            fs.existsSync(pkgJsonPath),
            `Releases read the previous version from "${ANCHOR_PACKAGE}" dist-tags, but ` +
                `packages/${ANCHOR_PACKAGE} no longer exists. Point ANCHOR_PACKAGE in ` +
                `scripts/release/src/fetchNpmVersion.ts at a package this repo still publishes.`
        ).toBe(true);

        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));

        expect(pkgJson.name).toBe(ANCHOR_PACKAGE);
        expect(pkgJson.private).toBeFalsy();
    });
});

describe("fetchNpmDistTags", () => {
    it("should return the anchor package's dist-tags", async () => {
        const distTags = { latest: "6.4.11", alpha: "6.6.0-alpha.0" };
        const mockedFetch = mockRegistry({
            ok: true,
            status: 200,
            json: async () => ({ "dist-tags": distTags })
        });

        expect(await fetchNpmDistTags()).toEqual(distTags);
        expect(mockedFetch).toHaveBeenCalledWith("https://registry.npmjs.org/webiny");
    });

    it("should not retry when the anchor package is not published", async () => {
        const mockedFetch = mockRegistry({ ok: false, status: 404 });

        await expect(fetchNpmDistTags()).rejects.toThrow(/is not published/);
        expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw when the registry returns no dist-tags", async () => {
        mockRegistry({ ok: true, status: 200, json: async () => ({}) });

        await expect(fetchNpmDistTags({ retries: 0 })).rejects.toThrow(/no "dist-tags"/);
    });

    it("should retry a failing registry", async () => {
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
