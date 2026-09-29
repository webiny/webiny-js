import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

vi.mock("execa", () => ({
    execa: vi.fn()
}));

import { execa } from "execa";
import { publishPackages } from "../src/publishPackages";

const mockedExeca = vi.mocked(execa);

const logger = {
    log: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
};

const VERSION = "6.6.0-alpha.0";

let tmpDir: string;
let originalCwd: string;

function createPackage(name: string) {
    const distDir = path.join(tmpDir, "packages", name, "dist");
    fs.mkdirSync(distDir, { recursive: true });

    const pkgJson = { name: `@webiny/${name}`, version: "0.0.0", webiny: { publishFrom: "dist" } };
    fs.writeFileSync(
        path.join(tmpDir, "packages", name, "package.json"),
        JSON.stringify(pkgJson, null, 2)
    );
    fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(pkgJson, null, 2));
}

function alreadyPublishedError(name: string) {
    return Object.assign(Error(`Command failed with exit code 1: npm publish ${name}`), {
        stderr:
            `npm error code E403\nnpm error 403 403 Forbidden - PUT ` +
            `https://registry.npmjs.org/@webiny%2f${name} - You cannot publish over the ` +
            `previously published versions: ${VERSION}.`
    });
}

// Routes the two commands publishPackages runs: "npm pack" always succeeds, "npm publish" fails
// for whichever tarballs `failFor` matches.
function mockNpm(failFor: (tarball: string) => Error | undefined = () => undefined) {
    mockedExeca.mockImplementation((async (_cmd: string, args: string[]) => {
        if (args[0] === "pack") {
            const pkgRoot = args[2];
            return { stdout: `${path.basename(pkgRoot)}-${VERSION}.tgz` } as any;
        }

        const error = failFor(path.basename(args[1]));
        if (error) {
            throw error;
        }

        return { stdout: "" } as any;
    }) as any);
}

function publishCalls() {
    return mockedExeca.mock.calls.filter(call => (call[1] as string[])?.[0] === "publish");
}

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webiny-publish-"));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    vi.clearAllMocks();
});

afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("publishPackages", () => {
    it("should publish every non-private package", async () => {
        createPackage("api-core");
        createPackage("app-admin");
        mockNpm();

        const results = await publishPackages({ distTag: "alpha", version: VERSION, logger });

        expect(results).toEqual([
            { name: "@webiny/api-core", success: true },
            { name: "@webiny/app-admin", success: true }
        ]);
    });

    // NPM answers a re-publish with a permanent 403. Retrying it was what pushed the 150-package
    // alpha release past the registry's rate limit and into 429s.
    it("should not retry a package whose version is already on NPM", async () => {
        createPackage("api-core");
        mockNpm(tarball =>
            tarball.startsWith("api-core") ? alreadyPublishedError("api-core") : undefined
        );

        const results = await publishPackages({
            distTag: "alpha",
            version: VERSION,
            retries: 5,
            logger
        });

        expect(publishCalls()).toHaveLength(1);
        expect(results).toEqual([
            {
                name: "@webiny/api-core",
                success: false,
                error: `@webiny/api-core@${VERSION} is already on NPM.`,
                versionTaken: true
            }
        ]);
    });

    it("should stop the release once a version turns out to be taken", async () => {
        for (const name of ["p1", "p2", "p3", "p4", "p5", "p6"]) {
            createPackage(name);
        }
        mockNpm(tarball => (tarball.startsWith("p1") ? alreadyPublishedError("p1") : undefined));

        const results = await publishPackages({
            distTag: "alpha",
            version: VERSION,
            concurrency: 2,
            logger
        });

        // Only the first batch runs, so packages 3 through 6 are never attempted.
        expect(results.map(r => r.name)).toEqual(["@webiny/p1", "@webiny/p2"]);
        expect(publishCalls()).toHaveLength(2);
    });

    it("should skip a package a local registry reports as a conflict", async () => {
        createPackage("api-core");
        mockNpm(() =>
            Object.assign(Error("Command failed with exit code 1"), {
                stderr: "npm error code E409\nnpm error 409 Conflict"
            })
        );

        const results = await publishPackages({ distTag: "local-npm", version: VERSION, logger });

        expect(results).toEqual([{ name: "@webiny/api-core", success: true }]);
    });
});
