export interface NextProcessor<TInput> {
    (input: TInput): TInput;
}

export interface NextAsyncProcessor<TInput> {
    (input: TInput): Promise<TInput>;
}

export interface Processor<TInput> {
    (next: NextProcessor<TInput>): NextProcessor<TInput>;
}

export interface AsyncProcessor<TInput> {
    (next: NextAsyncProcessor<TInput>): NextAsyncProcessor<TInput>;
}

export function composeSync<TInput = unknown>(
    functions: Array<Processor<TInput>> = []
): NextProcessor<TInput> {
    return (input: TInput): TInput => {
        if (!functions.length) {
            return input;
        }

        let index = -1;

        const next: NextProcessor<TInput> = input => {
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

export function composeAsync<TInput = unknown>(
    functions: Array<AsyncProcessor<TInput>> = []
): NextAsyncProcessor<TInput> {
    console.log("composeAsync123");
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
