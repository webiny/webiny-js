import { OperatorsProcessor } from './../src/processors';

declare type QueryOptions = {
    table: string,
    columns?: Array<string>,
    where?: Object,
    order?: { [string]: number },
    limit?: number,
    offset?: number
};

declare type Payload = {
    [string]: mixed;
}

declare type Operator = {
    canProcess: ({ key: string, value: any, processor: OperatorsProcessor }) => boolean,
    process: ({ key: string, value: any, processor: OperatorsProcessor }) => string
}
