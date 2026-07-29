import path from "path";
import fs from "fs";
import {
    ApiAfterBuild,
    GetProjectConfigService,
    GetProjectService,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getServerBuildPaths } from "./getServerBuildPaths.js";
import { getServerDbDriver } from "./getServerDbDriver.js";

/**
 * Keep the deploy artifact single-driver. knex loads its SQL driver by client string at runtime, so
 * @vercel/nft (which traces static requires) can't tell which one the app uses and copies BOTH drivers
 * into build/node_modules. Only the configured factory is imported by the api entry, so the other
 * driver is dead weight. Remove it — a Postgres build ships no `better-sqlite3`, a SQLite build no `pg`.
 *
 * Runs after CopyExternalDependencies (which does the nft copy). The package sets below are each
 * driver's own dependency closure; the two never overlap, so removing the unused one is safe.
 */
const DRIVER_PACKAGES: Record<string, string[]> = {
    sqlite: ["better-sqlite3", "bindings", "file-uri-to-path"],
    postgres: [
        "pg",
        "pg-cloudflare",
        "pg-connection-string",
        "pg-int8",
        "pg-pool",
        "pg-protocol",
        "pg-types",
        "pgpass"
    ]
};

class PruneUnusedDbDriverImpl implements ApiAfterBuild.Interface {
    constructor(
        private getProjectConfigService: GetProjectConfigService.Interface,
        private getProjectService: GetProjectService.Interface,
        private logger: LoggerService.Interface
    ) {}

    async execute() {
        const { buildDir } = getServerBuildPaths(this.getProjectService);
        const nodeModules = path.join(buildDir, "node_modules");
        if (!fs.existsSync(nodeModules)) {
            return;
        }

        const driver = await getServerDbDriver(this.getProjectConfigService);
        const unused = driver === "postgres" ? "sqlite" : "postgres";

        let removed = 0;
        for (const pkg of DRIVER_PACKAGES[unused]) {
            const dir = path.join(nodeModules, pkg);
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
                removed++;
            }
        }

        this.logger.debug("Pruned the unused %s database driver (%s package(s)).", unused, removed);
    }
}

export const PruneUnusedDbDriver = ApiAfterBuild.createImplementation({
    implementation: PruneUnusedDbDriverImpl,
    dependencies: [GetProjectConfigService, GetProjectService, LoggerService]
});
