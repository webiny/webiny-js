import { useHandler } from "~tests/utils/useHandler";

interface TimeLimiter {
    timeLeft: number;
}

type ResumableHandler = () => ReturnType<ReturnType<typeof useHandler>>;

export const runResumableMigration = async (
    timeLimiter: TimeLimiter,
    handler: ResumableHandler
) => {
    const timeout =
        "LAMBDA_TIMEOUT" in process.env ? parseInt(String(process.env["LAMBDA_TIMEOUT"])) : 5000;

    while (true) {
        // Set the default cut-off point (hardcoded to 2 minutes in the MigrationRunner)
        timeLimiter.timeLeft = 120000;

        // Allow handler to run for 5 seconds
        timeLimiter.timeLeft += timeout;

        const interval = setInterval(() => {
            timeLimiter.timeLeft -= 1000;
        }, 1000);

        const { data, error } = await handler();
        clearInterval(interval);

        if (error) {
            return { data, error };
        }

        if (data.resume) {
            process.stdout.write("\nResuming migration...\n");
            continue;
        }

        return { data, error };
    }
};
