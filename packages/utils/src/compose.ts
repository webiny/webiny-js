export interface NextAsyncProcessor<TInput, TOutput> {
    (input: TInput): Promise<TOutput>;
}

export interface AsyncProcessor<TInput, TOutput = TInput> {
    (next: NextAsyncProcessor<TInput, TOutput>): NextAsyncProcessor<TInput, TOutput>;
}

export interface NextSyncProcessor<TInput, TOutput = TInput> {
    (input: TInput): TOutput;
}

export interface SyncProcessor<TInput, TOutput = TInput> {
    (next: NextSyncProcessor<TInput, TOutput>): NextSyncProcessor<TInput, TOutput>;
}

export function composeAsync<TInput = unknown, TOutput = TInput>(
    functions: Array<AsyncProcessor<TInput, TOutput>> = []
): NextAsyncProcessor<TInput, TOutput> {
    return (input: TInput): Promise<TOutput> => {
        if (!functions.length) {
            return Promise.resolve(input as unknown as TOutput);
        }

        let index = -1;

        const next: NextAsyncProcessor<TInput, TOutput> = async input => {
            index++;

            const fn = functions[index];
            if (!fn) {
                return input as unknown as TOutput;
            }

            return fn(next)(input);
        };

        return next(input);
    };
}

export function composeSync<TInput = unknown, TOutput = TInput>(
    functions: Array<SyncProcessor<TInput, TOutput>> = []
): NextSyncProcessor<TInput, TOutput> {
    return (input: TInput): TOutput => {
        if (!functions.length) {
            return input as unknown as TOutput;
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        let index = -1;

        const next: NextSyncProcessor<TInput, TOutput> = input => {
            index++;

            const fn = functions[index];
            if (!fn) {
                return input as unknown as TOutput;
            }

            return fn(next)(input);
        };

        return next(input);
    };
}
