import { GenericRecord } from "@webiny/api/types";
import { IInvokeCb } from "~tests/handlers/types";

export interface IQueryParams<T = GenericRecord> {
    variables?: T;
    headers?: GenericRecord;
}

export interface IQuery<T = GenericRecord> {
    (params?: IQueryParams<T>): Promise<any>;
}

export interface ICreateQueryCbParams {
    query: string;
}

export interface ICreateQueryCb {
    (params: ICreateQueryCbParams): IQuery;
}

export interface ICreateQueryFactoryParams {
    invoke: IInvokeCb;
}

export interface ICreateQueryFactory {
    (params: ICreateQueryFactoryParams): ICreateQueryCb;
}
