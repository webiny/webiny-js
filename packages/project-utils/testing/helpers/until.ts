import { sleep } from "./sleep";

export interface UntilOptions {
    name?: string;
    tries?: number;
    wait?: number;
    debounce?: number;
}

export const until = async (execute, until, options: UntilOptions = {}) => {
    const { name = "NO_NAME", tries = 10, wait = 1000, debounce = 0 } = options;

    let result;
    let triesCount = 0;

    if (debounce > 0) {
        await sleep(debounce);
    }

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
        await sleep(wait);
    }

    throw new Error(`[${name}] Tried ${tries} times but failed.`);
};
