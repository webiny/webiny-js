import { MigrationRunnerResult, MigrationRunReporter } from "~/cli";
import center from "center-align";
import { CliContext } from "@webiny/cli/types";
import { LogReporter } from "~/cli";

export class CliMigrationRunReporter implements MigrationRunReporter {
    private context: CliContext;
    private logReporter: LogReporter;

    constructor(logReporter: LogReporter, context: CliContext) {
        this.logReporter = logReporter;
        this.context = context;
    }

    report(result: MigrationRunnerResult): Promise<void> {
        result.onSuccess(data => {
            const functionName = result.getFunctionName().split(":").pop();
            process.stdout.write("\n");
            this.context.success(`Data migration Lambda %s executed successfully!`, functionName);

            const { migrations, ...run } = data;
            if (!migrations.length) {
                this.context.info(`No applicable migrations were found!`);
                return;
            }

            const maxLength = Math.max(...migrations.map(mig => mig.status.length)) + 2;
            this.context.info(`Migration run: %s`, run.id);
            this.context.info(`Status: %s`, run.status);
            this.context.info(`Started on: %s`, run.startedOn);
            if (run.status === "done") {
                this.context.info(`Finished on: %s`, run.finishedOn);
            }
            for (const migration of migrations) {
                this.context.info(
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
            this.context.error(error.message);
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
