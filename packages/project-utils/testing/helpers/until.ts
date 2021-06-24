export interface UntilOptions {
    name?: string;
    tries?: number;
    wait?: number;
}

export const until = async (execute, until, options: UntilOptions = {}) => {
    const { name = "NO_NAME", tries = 5, wait = 300 } = options;

    let result;
    let triesCount = 0;

    while (true) {
        result = await execute();

        let done;
        try {
            done = await until(result);
        } catch {}

        if (done) {
            return result;
        }

        triesCount++;
        if (triesCount === tries) {
            break;
        }

        // Wait.
        await new Promise((resolve: any) => {
            setTimeout(() => resolve(), wait);
        });
    }

    throw new Error(
        `[${name}] Tried ${tries} times but failed. Last result that was received: ${JSON.stringify(
            result,
            null,
            2
        )}`
    );
};
