import minimatch from "minimatch";
import { IsMigrationApplicable } from "~/MigrationRunner";

export const createPatternMatcher = (pattern: string): IsMigrationApplicable => {
    return migration => {
        if (pattern.includes("*")) {
            return minimatch(migration.getId(), pattern);
        }
        return migration.getId() === pattern;
    };
};
