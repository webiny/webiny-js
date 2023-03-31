import { MigrationRunItem } from "@webiny/data-migration";

export const groupMigrations = (migrations: MigrationRunItem[]) => {
    return {
        executed: migrations.filter(mig => mig.status === "done"),
        skipped: migrations.filter(mig => mig.status === "skipped"),
        errored: migrations.filter(mig => mig.status === "error"),
        notApplicable: migrations.filter(mig => mig.status === "not-applicable")
    };
};
