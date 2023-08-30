import { MigrationStatusReporter } from "~/cli/MigrationStatusReporter";
import { MigrationStatus } from "~/types";
import { LogReporter } from "~/cli/LogReporter";

export class NonInteractiveCliStatusReporter implements MigrationStatusReporter {
    private logReporter: LogReporter;
    private firstCall = true;

    constructor(logReporter: LogReporter) {
        this.logReporter = logReporter;
        console.log(`Using "NonInteractiveCliStatusReporter".`);
    }

    async report(migrationStatus: MigrationStatus) {
        const { status, context } = migrationStatus;

        const currentLogStreamName = context?.logStreamName;

        if (currentLogStreamName) {
            this.logReporter.initializeStream(currentLogStreamName);
            if (this.firstCall) {
                this.logReporter.printLogStreamLinks();
                process.stdout.write(`\n---------- MIGRATION LOGS START ----------\n\n`);
            }
            await this.logReporter.printLogs(currentLogStreamName);
        }

        if (["done", "error"].includes(status)) {
            // We want to give AWS some time for the latest log events to become available.
            await new Promise(resolve => {
                setTimeout(resolve, 10000);
            });

            if (currentLogStreamName) {
                await this.logReporter.printLogs(currentLogStreamName);
                process.stdout.write(`\n---------- MIGRATION LOGS END ----------\n`);
            }
        }

        this.firstCall = false;
    }
}
