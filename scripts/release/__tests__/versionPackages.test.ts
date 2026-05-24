import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { versionPackages } from "../src/versionPackages";

let tmpDir: string;
let originalCwd: string;

function createPackage(
    name: string,
    opts: { private?: boolean; publishFrom?: string; deps?: Record<string, string> } = {}
) {
    const { private: isPrivate = false, publishFrom = "dist", deps = {} } = opts;
    const pkgDir = path.join(tmpDir, "packages", name);
    fs.mkdirSync(pkgDir, { recursive: true });

    const pkgJson: Record<string, any> = {
        name: `@webiny/${name}`,
        version: "0.0.0",
        ...(isPrivate && { private: true }),
        ...(Object.keys(deps).length > 0 && { dependencies: deps }),
        ...(publishFrom !== "." && { webiny: { publishFrom } })
    };

    fs.writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify(pkgJson, null, 2));

    if (publishFrom && publishFrom !== ".") {
        const distDir = path.join(pkgDir, publishFrom);
        fs.mkdirSync(distDir, { recursive: true });

        const distPkgJson = { ...pkgJson };
        fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(distPkgJson, null, 2));
    }
}

function readPublishedPkgJson(name: string, publishFrom = "dist") {
    if (publishFrom && publishFrom !== ".") {
        return JSON.parse(
            fs.readFileSync(
                path.join(tmpDir, "packages", name, publishFrom, "package.json"),
                "utf8"
            )
        );
    }
    return JSON.parse(fs.readFileSync(path.join(tmpDir, "packages", name, "package.json"), "utf8"));
}

describe("versionPackages", () => {
    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "release-test-"));
        fs.mkdirSync(path.join(tmpDir, "packages"), { recursive: true });
        originalCwd = process.cwd();
        process.chdir(tmpDir);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("should rewrite version in dist/package.json", () => {
        createPackage("api-core");
        const results = versionPackages("6.4.0");

        expect(results).toHaveLength(1);
        const pkg = readPublishedPkgJson("api-core");
        expect(pkg.version).toBe("6.4.0");
    });

    it("should rewrite @webiny/* dependency versions", () => {
        createPackage("api-core", {
            deps: {
                "@webiny/utils": "0.0.0",
                "@webiny/plugins": "0.0.0",
                lodash: "^4.18.0"
            }
        });

        versionPackages("6.4.0");

        const pkg = readPublishedPkgJson("api-core");
        expect(pkg.dependencies["@webiny/utils"]).toBe("6.4.0");
        expect(pkg.dependencies["@webiny/plugins"]).toBe("6.4.0");
        expect(pkg.dependencies["lodash"]).toBe("^4.18.0");
    });

    it("should skip private packages", () => {
        createPackage("private-pkg", { private: true });
        const results = versionPackages("6.4.0");
        expect(results).toHaveLength(0);
    });

    it("should write to root package.json for packages without webiny.publishFrom", () => {
        createPackage("no-build", { publishFrom: "." });
        versionPackages("6.4.0");

        const pkg = readPublishedPkgJson("no-build", ".");
        expect(pkg.version).toBe("6.4.0");
    });

    it("should handle multiple packages", () => {
        createPackage("api-core");
        createPackage("api-headless-cms", {
            deps: { "@webiny/api-core": "0.0.0" }
        });
        createPackage("private-pkg", { private: true });

        const results = versionPackages("6.5.0");
        expect(results).toHaveLength(2);

        const core = readPublishedPkgJson("api-core");
        expect(core.version).toBe("6.5.0");

        const cms = readPublishedPkgJson("api-headless-cms");
        expect(cms.version).toBe("6.5.0");
        expect(cms.dependencies["@webiny/api-core"]).toBe("6.5.0");
    });
});
