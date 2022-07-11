export interface NextAsyncProcessor<TInput> {
    (input: TInput): Promise<TInput>;
}

export interface AsyncProcessor<TInput> {
    (next: NextAsyncProcessor<TInput>): NextAsyncProcessor<TInput>;
}

export interface NextSyncProcessor<TInput> {
    (input: TInput): TInput;
}

export interface SyncProcessor<TInput> {
    (next: NextSyncProcessor<TInput>): NextSyncProcessor<TInput>;
}

export function composeAsync<TInput = unknown>(
    functions: Array<AsyncProcessor<TInput>> = []
): NextAsyncProcessor<TInput> {
    return (input: TInput): Promise<TInput> => {
        if (!functions.length) {
            return Promise.resolve(input);
        }

        let index = -1;

        const next: NextAsyncProcessor<TInput> = async input => {
            index++;

            const fn = functions[index];
            if (!fn) {
                return input;
            }

            return fn(next)(input);
        };

        return next(input);
    };
}

export function composeSync<TInput = unknown>(
    functions: Array<SyncProcessor<TInput>> = []
): NextSyncProcessor<TInput> {
    return (input: TInput): TInput => {
        if (!functions.length) {
            return input;
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        let index = -1;

        const next: NextSyncProcessor<TInput> = input => {
            index++;

            const fn = functions[index];
            if (!fn) {
                return input;
            }

            return fn(next)(input);
        };

        return next(input);
    };
}
