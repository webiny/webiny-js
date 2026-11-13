import path from "path";
import fs from "fs";
import os from "os";
import { createRequire } from "module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyPgRuntimeModules } from "~/extensions/Postgres/copyPgRuntimeModules.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");

const listPackages = (nodeModulesDir: string): string[] => {
    if (!fs.existsSync(nodeModulesDir)) {
        return [];
    }
    return fs.readdirSync(nodeModulesDir).flatMap(name => {
        if (name.startsWith("@")) {
            return fs.readdirSync(path.join(nodeModulesDir, name)).map(sub => `${name}/${sub}`);
        }
        return [name];
    });
};

interface FixturePackage {
    version: string;
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    main?: string;
    files?: Record<string, string>;
}

/* Writes a package into `<dir>/node_modules/<name>`. */
const writePackage = (dir: string, name: string, pkg: FixturePackage) => {
    const pkgDir = path.join(dir, "node_modules", name);
    fs.mkdirSync(pkgDir, { recursive: true });
    const { files = { "index.js": "module.exports = {};" }, ...json } = pkg;
    fs.writeFileSync(
        path.join(pkgDir, "package.json"),
        JSON.stringify({ name, main: "index.js", ...json })
    );
    for (const [file, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(pkgDir, file)), { recursive: true });
        fs.writeFileSync(path.join(pkgDir, file), content);
    }
    return pkgDir;
};

describe("copyPgRuntimeModules", () => {
    let tmp: string;

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pg-modules-"));
    });

    afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it("copies knex, pg and their dependencies, and nothing else from the install", async () => {
        const project = path.join(tmp, "project");
        writePackage(project, "@webiny/api-event-handler-aws-pg", {
            version: "1.0.0",
            dependencies: { knex: "^3", pg: "^8" },
            files: {
                "index.js": `require("knex"); require("sharp"); require("@aws-sdk/client-s3");`
            }
        });
        writePackage(project, "knex", {
            version: "3.3.0",
            dependencies: { tarn: "^3", "pg-connection-string": "2.6.2" },
            peerDependencies: { pg: "*", "better-sqlite3": "*" },
            files: {
                "index.js": `require("./lib/client.js");`,
                "lib/client.js": [
                    `require("tarn");`,
                    `require("pg-connection-string");`,
                    `exports.pg = () => require("pg");`,
                    `exports.sqlite = () => require("better-sqlite3");`
                ].join("\n"),
                "lib/unused.js": `module.exports = 1;`,
                "README.md": "# knex"
            }
        });
        writePackage(project, "tarn", { version: "3.0.2" });
        writePackage(project, "pg", {
            version: "8.23.1",
            dependencies: { "pg-connection-string": "^2.9.0" },
            optionalDependencies: { "pg-cloudflare": "^1", "pg-missing-optional": "^1" },
            files: {
                "index.js": `require("pg-connection-string"); require("pg-cloudflare");`
            }
        });
        writePackage(project, "pg-cloudflare", { version: "1.2.0" });
        // pg's own version at the top; knex's older one nested under knex, as an install lays it out.
        writePackage(project, "pg-connection-string", { version: "2.9.1" });
        writePackage(path.join(project, "node_modules", "knex"), "pg-connection-string", {
            version: "2.6.2"
        });
        writePackage(project, "better-sqlite3", { version: "12.0.0" });
        writePackage(project, "sharp", { version: "0.34.0" });
        writePackage(project, "@aws-sdk/client-s3", { version: "3.0.0" });

        const graphql = path.join(project, ".webiny", "workspace", "apps", "api", "graphql");
        const buildDir = path.join(graphql, "build");
        fs.mkdirSync(buildDir, { recursive: true });

        const result = await copyPgRuntimeModules({ resolveFrom: graphql, buildDir });

        expect(result.packages).toEqual([
            "knex@3.3.0",
            "pg-cloudflare@1.2.0",
            "pg-connection-string@2.6.2",
            "pg-connection-string@2.9.1",
            "pg@8.23.1",
            "tarn@3.0.2"
        ]);

        const nodeModules = path.join(buildDir, "node_modules");
        expect(listPackages(nodeModules).sort()).toEqual([
            "knex",
            "pg",
            "pg-cloudflare",
            "pg-connection-string",
            "tarn"
        ]);
        // Each package resolves the version it was installed with.
        const fromKnex = createRequire(path.join(nodeModules, "knex", "index.js"));
        const fromPg = createRequire(path.join(nodeModules, "pg", "index.js"));
        expect(fromKnex("pg-connection-string/package.json").version).toBe("2.6.2");
        expect(fromPg("pg-connection-string/package.json").version).toBe("2.9.1");
        expect(fromKnex("pg/package.json").version).toBe("8.23.1");

        // Only the files the entry can load, not the package's whole folder.
        expect(fs.existsSync(path.join(nodeModules, "knex", "lib", "client.js"))).toBe(true);
        expect(fs.existsSync(path.join(nodeModules, "knex", "lib", "unused.js"))).toBe(false);
        expect(fs.existsSync(path.join(nodeModules, "knex", "README.md"))).toBe(false);
    });

    it("says which package is missing when the project doesn't have the Postgres handler", async () => {
        const graphql = path.join(tmp, "project", "graphql");
        fs.mkdirSync(path.join(graphql, "build"), { recursive: true });

        await expect(
            copyPgRuntimeModules({ resolveFrom: graphql, buildDir: path.join(graphql, "build") })
        ).rejects.toThrow("@webiny/api-event-handler-aws-pg");
    });

    it("gives the build a knex that loads the pg driver, with the repo's real packages", async () => {
        // A project whose handler package is the repo's own: knex and pg resolve from it, as in the
        // monorepo's install.
        const project = path.join(tmp, "project");
        fs.mkdirSync(path.join(project, "node_modules", "@webiny"), { recursive: true });
        fs.symlinkSync(
            path.join(repoRoot, "packages", "api-event-handler-aws-pg"),
            path.join(project, "node_modules", "@webiny", "api-event-handler-aws-pg")
        );
        const buildDir = path.join(project, "build");
        fs.mkdirSync(buildDir);

        await copyPgRuntimeModules({ resolveFrom: project, buildDir });

        const nodeModules = path.join(buildDir, "node_modules");
        const packages = listPackages(nodeModules);
        expect(packages).toContain("knex");
        expect(packages).toContain("pg");
        expect(packages).not.toContain("sharp");
        expect(packages).not.toContain("better-sqlite3");
        expect(packages.some(name => name.startsWith("@aws-sdk/"))).toBe(false);

        // What the bundle does at runtime: load knex from build/node_modules, which loads pg.
        const requireFromBuild = createRequire(path.join(buildDir, "handler.js"));
        expect(fs.realpathSync(requireFromBuild.resolve("knex"))).toContain(nodeModules);
        const knex = requireFromBuild("knex");
        const db = knex({ client: "pg", connection: { host: "localhost" } });
        try {
            expect(db.client.driver).toBe(requireFromBuild("pg"));
            expect(db("users").where({ id: 1 }).toString()).toBe(
                `select * from "users" where "id" = 1`
            );
        } finally {
            await db.destroy();
        }
    });
});
