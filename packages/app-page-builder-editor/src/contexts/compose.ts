export interface ComposeAsyncCallable {
    (...args: any[]): Promise<any>;
}
export const composeAsync = (functions: ComposeAsyncCallable[] = []) => {
    return (input: unknown): Promise<any> => {
        if (!functions.length) {
            return Promise.resolve();
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        let index = -1;

        const next = (input: unknown) => {
            index++;

            const fn = functions[index];
            if (!fn) {
                return Promise.resolve(input);
            }

            return new Promise(async (resolve, reject) => {
                try {
                    resolve(await fn(input, next));
                } catch (e) {
                    reject(e);
                }
            });
        };

        return next(input);
    };
};

export interface ComposeSyncCallable {
    (...args: any[]): any;
}
export const composeSync = (functions: ComposeSyncCallable[] = []) => {
    return (input: unknown) => {
        if (!functions.length) {
            return input;
        }

        // Create a clone of function chain to prevent modifying the original array with `shift()`
        let index = -1;

        const next = (input: unknown) => {
            index++;

            const fn = functions[index];
            if (!fn) {
                return input;
            }

            return fn(input, next);
        };

        return next(input);
    };
};
