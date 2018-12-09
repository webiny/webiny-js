import type Statement from "./src/statements/statement";

export type Payload = {
    [string]: mixed
};

export type Operator = {
    canProcess: ({ key: string, value: any, processor: Statement }) => boolean,
    process: ({ key: string, value: any, processor: Statement }) => string
};
