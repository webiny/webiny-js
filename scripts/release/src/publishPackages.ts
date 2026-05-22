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

    const toPublish: { name: string; publishDir: string }[] = [];

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

        const publishConfig = pkgJson.publishConfig as Record<string, string> | undefined;
        const publishDir = publishConfig?.directory
            ? path.join(pkgRoot, publishConfig.directory)
            : pkgRoot;

        toPublish.push({ name: pkgJson.name!, publishDir });
    }

    logger.info("Publishing %s packages with dist-tag %s", toPublish.length, distTag);

    const results: PublishResult[] = [];

    for (let i = 0; i < toPublish.length; i += concurrency) {
        const batch = toPublish.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(async (pkg): Promise<PublishResult> => {
                try {
                    await pRetry(
                        () =>
                            execa("npm", ["publish", "--tag", distTag], {
                                cwd: pkg.publishDir,
                                stdio: "pipe"
                            }),
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
