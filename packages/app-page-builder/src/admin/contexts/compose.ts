export interface NextAsyncProcessor<TInput> {
    (input: TInput): Promise<TInput>;
}

export interface AsyncProcessor<TInput> {
    (next: NextAsyncProcessor<TInput>): NextAsyncProcessor<TInput>;
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
