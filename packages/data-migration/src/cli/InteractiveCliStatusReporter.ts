import readline from "readline";
import { MigrationStatusReporter } from "~/cli/MigrationStatusReporter";
import { MigrationStatus } from "~/types";
import { LogReporter } from "~/cli/LogReporter";

export class InteractiveCliStatusReporter implements MigrationStatusReporter {
    private logReporter: LogReporter;

    constructor(logReporter: LogReporter) {
        this.logReporter = logReporter;
        console.log(`Using "InteractiveCliStatusReporter".`);
    }

    report(migrationStatus: MigrationStatus): void {
        const { status, migrations, context } = migrationStatus;
        this.clearLine();

        const currentLogStreamName = context?.logStreamName;
        if (currentLogStreamName) {
            this.logReporter.initializeStream(currentLogStreamName);
        }

        if (status === "running") {
            const currentMigration = migrations.find(mig => mig.status === "running");
            if (currentMigration) {
                const duration = this.getDuration(String(currentMigration.startedOn));
                process.stdout.write(
                    `Running data migration ${currentMigration.id} (${duration})...`
                );
            }
            return;
        }

        if (status === "init") {
            process.stdout.write(`Checking data migrations...`);
        }

        if (status === "done") {
            this.clearLine();
        }
    }

    private clearLine() {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
    }

    private getDuration(since: string) {
        const ms = new Date().getTime() - new Date(since).getTime();
        let seconds = Math.floor(ms / 1000);
        let minutes = undefined;
        if (seconds > 60) {
            minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
        }

        return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
    }
}
