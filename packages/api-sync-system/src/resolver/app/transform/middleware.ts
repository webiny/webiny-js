import type { GenericRecord } from "@webiny/api/types";

export type Middleware<Input, Output> = (
    input: Input,
    next: () => Promise<Output>
) => Promise<Output>;

export function middleware<Input = GenericRecord, Output = GenericRecord>(
    middlewares: Middleware<Input, Output>[]
) {
    return async function runner(input: Input, defaultValue: Output): Promise<Output> {
        let current = -1;

        async function dispatch(index: number): Promise<Output> {
            /**
             * Should not be possible to run next multiple times.
             * Or do we want to allow it? What are possible downsides except something being done multiple times?
             */
            if (index <= current) {
                throw new Error("next() called multiple times");
            }
            current = index;

            const fn = middlewares[index];
            if (!fn) {
                return defaultValue;
            }

            return fn(input, () => dispatch(index + 1));
        }

        return dispatch(0);
    };
}
