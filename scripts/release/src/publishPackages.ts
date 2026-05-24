import fs from "fs";
import path from "path";
import { loadJsonFileSync } from "load-json-file";
import execa from "execa";
import pRetry from "p-retry";
import type { PackageJson } from "type-fest";

interface PublishResult {
    name: string;
    success: boolean;
    error?: string;
}

interface PublishOptions {
    distTag: string;
    concurrency?: number;
    retries?: number;
    logger: {
        info(...args: any[]): void;
        debug(...args: any[]): void;
        warning(...args: any[]): void;
        error(...args: any[]): void;
    };
}

export async function publishPackages(opts: PublishOptions): Promise<PublishResult[]> {
    const { distTag, concurrency = 10, retries = 3, logger } = opts;
    const packagesDir = path.resolve(process.cwd(), "packages");
    const entries = fs.readdirSync(packagesDir, { withFileTypes: true });

    const toPublish: { name: string; pkgRoot: string; publishDir: string }[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const pkgRoot = path.join(packagesDir, entry.name);
        const pkgJsonPath = path.join(pkgRoot, "package.json");

        if (!fs.existsSync(pkgJsonPath)) {
            continue;
        }

        const pkgJson = loadJsonFileSync<PackageJson>(pkgJsonPath);

        if (pkgJson.private) {
            continue;
        }

        const webiny = (pkgJson as any).webiny as { publishFrom?: string } | undefined;
        const publishDir = webiny?.publishFrom ? path.join(pkgRoot, webiny.publishFrom) : pkgRoot;

        toPublish.push({ name: pkgJson.name!, pkgRoot, publishDir });
    }

    logger.info("Publishing %s packages with dist-tag %s", toPublish.length, distTag);

    // Run per-package prepublishOnly scripts from the package root.
    for (const pkg of toPublish) {
        const pkgJson = loadJsonFileSync<PackageJson>(path.join(pkg.pkgRoot, "package.json"));
        const script = pkgJson.scripts?.prepublishOnly;
        if (!script) {
            continue;
        }
        logger.info("Running prepublishOnly for %s", pkg.name);
        await execa("sh", ["-c", script], { cwd: pkg.pkgRoot, stdio: "inherit" });
    }

    // Pack and publish each package.
    const results: PublishResult[] = [];

    for (let i = 0; i < toPublish.length; i += concurrency) {
        const batch = toPublish.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(async (pkg): Promise<PublishResult> => {
                try {
                    await pRetry(
                        async () => {
                            const { stdout: tarball } = await execa(
                                "npm",
                                ["pack", "--pack-destination", pkg.pkgRoot],
                                { cwd: pkg.publishDir, stdio: "pipe" }
                            );

                            const tarballPath = path.join(pkg.pkgRoot, tarball.trim());

                            try {
                                await execa("npm", ["publish", tarballPath, "--tag", distTag], {
                                    stdio: "pipe"
                                });
                            } catch (err: any) {
                                if (err.stderr && err.stderr.includes("E409")) {
                                    logger.info("Already published %s, skipping", pkg.name);
                                    return;
                                }
                                throw err;
                            } finally {
                                if (fs.existsSync(tarballPath)) {
                                    fs.unlinkSync(tarballPath);
                                }
                            }
                        },
                        { retries }
                    );
                    logger.info("Published %s", pkg.name);
                    return { name: pkg.name, success: true };
                } catch (err: any) {
                    logger.error("Failed to publish %s: %s", pkg.name, err.message);
                    return { name: pkg.name, success: false, error: err.message };
                }
            })
        );
        results.push(...batchResults);
    }

    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
        logger.warning("Failed to publish %s package(s):", failures.length);
        for (const f of failures) {
            logger.warning("  - %s: %s", f.name, f.error);
        }
    }

    return results;
}
