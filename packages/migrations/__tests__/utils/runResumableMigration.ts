import { useHandler } from "~tests/utils/useHandler";
import { MigrationEventHandlerResponse } from "@webiny/data-migration";
import { LambdaContext } from "@webiny/handler-aws/types";

interface TimeLimiter {
    timeLeft: number;
}

export const runResumableMigration = async (
    timeLimiter: TimeLimiter,
    handler: ReturnType<typeof useHandler>,
    payload: any
): Promise<NotUndefined<MigrationEventHandlerResponse>> => {
    const invokeMigration = () => {
        handler({ ...payload, command: "execute" }, {} as LambdaContext);
    };

    const getMigrationStatus = () => {
        return handler({ ...payload, command: "status" }, {} as LambdaContext);
    };

    startTimer(timeLimiter);

    invokeMigration();

    // Poll for status and re-execute when migration is in "pending" state.
    let response: MigrationEventHandlerResponse;
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await getMigrationStatus();

        if (!response) {
            console.log(`No response from getMigrationStatus()!`);
            continue;
        }

        // If we received an error, it must be an unrecoverable error, and we don't retry.
        const { data, error } = response;
        if (error) {
            return response;
        }

        switch (data.status) {
            case "init":
            case "running":
                continue;
            case "pending":
                process.stdout.write(
                    "[RESUMABLE MIGRATION] Migration process requires another invocation.\n"
                );
                startTimer(timeLimiter);
                // Invoke migration again, to continue from the last checkpoint.
                invokeMigration();
                break;
            case "done":
            default:
                return response;
        }
    }
};

const startTimer = (timeLimiter: TimeLimiter) => {
    const timeout =
        "LAMBDA_TIMEOUT" in process.env ? parseInt(String(process.env["LAMBDA_TIMEOUT"])) : 5000;

    // Set the default cut-off point (hardcoded to 2 minutes in the MigrationRunner)
    timeLimiter.timeLeft = 120000;

    // Allow handler to run for 5 seconds
    timeLimiter.timeLeft += timeout;

    const interval = setInterval(() => {
        timeLimiter.timeLeft -= 1000;

        if (timeLimiter.timeLeft < 120000) {
            clearInterval(interval);
        }
    }, 1000);
};

type NotUndefined<T> = T extends undefined ? never : T;
