import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * The Postgres storage is shared by the standalone server and AWS Lambda, so it may depend on
 * neither: no Node server, no self-hosted auth (standalone only) and nothing AWS.
 */
describe("api-storage-pg dependencies", () => {
    const packageJson = JSON.parse(
        fs.readFileSync(path.join(import.meta.dirname, "..", "package.json"), "utf8")
    ) as Record<string, Record<string, string> | undefined>;

    const dependencies = [
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {})
    ];

    it("has dependencies", () => {
        expect(dependencies).toContain("@webiny/api-core-sql");
    });

    it("depends on no standalone handler, self-hosted auth or AWS package", () => {
        const forbidden = dependencies.filter(name => {
            return (
                name.startsWith("@webiny/api-event-handler") ||
                name.startsWith("@webiny/self-hosted-auth") ||
                name.startsWith("@webiny/aws-sdk") ||
                name.startsWith("@aws-sdk/") ||
                /(^|[-/])aws($|-)/.test(name) ||
                name.includes("dynamodb")
            );
        });

        expect(forbidden).toEqual([]);
    });

    it("imports no standalone handler, self-hosted auth or AWS package", () => {
        const srcDir = path.join(import.meta.dirname, "..", "src");
        const imports = fs
            .readdirSync(srcDir, { recursive: true, encoding: "utf8" })
            .filter(file => file.endsWith(".ts"))
            .flatMap(file => {
                const source = fs.readFileSync(path.join(srcDir, file), "utf8");
                return [...source.matchAll(/from "([^"]+)"/g)].map(match => match[1]);
            });

        expect(imports.length).toBeGreaterThan(0);
        expect(
            imports.filter(name => /api-event-handler|self-hosted-auth|aws|dynamodb/.test(name))
        ).toEqual([]);
    });
});
