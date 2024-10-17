import { GenericRecord } from "@webiny/api/types";
import { IInvokeCb } from "~tests/handlers/types";

/**
 * Query
 */
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

/**
 * Mutation
 */
export interface IMutationParams<T = GenericRecord> {
    variables?: T;
    headers?: GenericRecord;
}

export interface IMutation<T = GenericRecord> {
    (params?: IMutationParams<T>): Promise<any>;
}
export type MutationBody = `mutation ${string}`;

export interface ICreateMutationCbParams {
    mutation: MutationBody;
}

export interface ICreateMutationCb {
    <T>(params: ICreateMutationCbParams): IMutation<T>;
}

export interface ICreateMutationFactoryParams {
    invoke: IInvokeCb;
}

export interface ICreateMutationFactory {
    (params: ICreateMutationFactoryParams): ICreateMutationCb;
}
