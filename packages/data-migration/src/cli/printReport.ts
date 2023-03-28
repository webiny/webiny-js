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

    context.success(`Data migration Lambda %s executed successfully!`, migrationLambdaArn);

    const { migrations } = response.data;
    if (!migrations.length) {
        context.info(`No applicable migrations were found!`);
        return;
    }

    const maxLength = Math.max(...migrations.map(mig => mig.status.length)) + 4;

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
