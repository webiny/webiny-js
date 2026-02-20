import { minimatch } from "minimatch";
import type { IsMigrationApplicable } from "~/MigrationRunner.js";

export const createPatternMatcher = (pattern: string): IsMigrationApplicable => {
    return migration => {
        if (pattern.includes("*")) {
            return minimatch(migration.getId(), pattern);
        }
        return migration.getId() === pattern;
    };
};
