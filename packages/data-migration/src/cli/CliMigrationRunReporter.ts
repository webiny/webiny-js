import type { MigrationRunnerResult, MigrationRunReporter } from "~/cli/index.js";
import center from "center-align";
import type { LogReporter } from "~/cli/index.js";
import { UiService } from "@webiny/project/abstractions/index.js";

export interface CliMigrationRunReporterDi {
    uiService: UiService.Interface;
}

export class CliMigrationRunReporter implements MigrationRunReporter {
    private di: {
        uiService: UiService.Interface;
    };
    private logReporter: LogReporter;

    constructor(logReporter: LogReporter, di: CliMigrationRunReporterDi) {
        this.logReporter = logReporter;
        this.di = di;
    }

    report(result: MigrationRunnerResult): Promise<void> {
        const { uiService: ui } = this.di;

        result.onSuccess(data => {
            const functionName = result.getFunctionName().split(":").pop();
            process.stdout.write("\n");
            ui.success(`Data migration Lambda %s executed successfully!`, functionName);

            const { migrations, ...run } = data;
            if (!migrations.length) {
                ui.info(`No applicable migrations were found!`);
                return;
            }

            const maxLength = Math.max(...migrations.map(mig => mig.status.length)) + 2;
            ui.info(`Migration run: %s`, run.id);
            ui.info(`Status: %s`, run.status);
            ui.info(`Started on: %s`, run.startedOn);
            if (run.status === "done") {
                ui.info(`Finished on: %s`, run.finishedOn);
            }
            for (const migration of migrations) {
                ui.info(
                    ...[
                        `[%s] %s: ${migration.description}`,
                        center(this.makeEven(migration.status), maxLength),
                        migration.id
                    ]
                );
            }

            this.logReporter.printLogStreamLinks();
        });

        result.onError(error => {
            ui.error(error.message);
        });

        // Process the result!
        return result.process();
    }

    private makeEven(str: string) {
        if (str.length % 2 > 0) {
            return str + " ";
        }
        return str;
    }
}
