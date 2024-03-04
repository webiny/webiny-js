import { GenericRecord } from "@webiny/api/types";

export interface MiddlewareCallable<
    I extends GenericRecord = GenericRecord,
    O extends GenericRecord = GenericRecord
> {
    (input: I, next: () => Promise<O>): Promise<O>;
}

export const middleware = <
    I extends GenericRecord = GenericRecord,
    O extends GenericRecord = GenericRecord
>(
    functions: MiddlewareCallable<I, O>[]
) => {
    return async (input: I): Promise<O> => {
        const chain = Array.from(functions);
        const exec = async (): Promise<O> => {
            const fn = chain.shift();
            if (!fn) {
                return {} as O;
            }
            const next = async () => {
                return exec();
            };
            return fn(input, next);
        };
        return exec();
    };
};
