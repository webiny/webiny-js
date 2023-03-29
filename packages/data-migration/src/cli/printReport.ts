import { CliContext } from "@webiny/cli/types";
import { MigrationEventHandlerResponse, MigrationInvocationErrorResponse } from "~/types";
import center from "center-align";

interface ReportParams {
    response: MigrationEventHandlerResponse;
    migrationLambdaArn: string;
    context: CliContext;
}

const isError = (
    response: MigrationEventHandlerResponse
): response is MigrationInvocationErrorResponse => {
    if (!response) {
        return false;
    }

    return "error" in response;
};

const makeEven = (str: string) => {
    if (str.length % 2 > 0) {
        return str + " ";
    }
    return str;
};

export const printReport = ({ response, migrationLambdaArn, context }: ReportParams) => {
    if (!response) {
        return;
    }

    if (isError(response)) {
        context.error(response.error.message);
        return;
    }

    const functionName = migrationLambdaArn.split(":").pop();
    context.success(`Data migration Lambda %s executed successfully!`, functionName);

    const { migrations, ...run } = response.data;
    if (!migrations.length) {
        context.info(`No applicable migrations were found!`);
        return;
    }

    const maxLength = Math.max(...migrations.map(mig => mig.status.length)) + 2;
    context.info(`Migration run: %s`, run.id);
    context.info(`Status: %s`, run.status);
    context.info(`Started on: %s`, run.startedOn);
    if (run.status === "done") {
        context.info(`Finished on: %s`, run.finishedOn);
    }
    for (const migration of migrations) {
        context.info(
            ...[
                `[%s] %s: ${migration.description}`,
                center(makeEven(migration.status), maxLength),
                migration.id
            ]
        );
    }
};
