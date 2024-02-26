import { MigrationStatus } from "~/types";

export interface MigrationStatusReporter {
    report(status: MigrationStatus): void;
}
