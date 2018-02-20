import type { OperatorsProcessor } from "./../src/processors";

export type OrderTuple = [string, number];

export type QueryOptions = {
    table: string,
    columns?: Array<string>,
    where?: Object,
    order?: Array<OrderTuple>,
    limit?: number,
    offset?: number
};

export type Payload = {
    [string]: mixed
};

export type Operator = {
    canProcess: ({ key: string, value: any, processor: OperatorsProcessor }) => boolean,
    process: ({ key: string, value: any, processor: OperatorsProcessor }) => string
};
