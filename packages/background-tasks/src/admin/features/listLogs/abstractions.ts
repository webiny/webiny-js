import { createAbstraction } from "@webiny/feature/admin";
import type { TaskLog } from "~/admin/shared/types.js";

export interface IListLogsInput {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface IListLogsMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListLogsOutput {
    items: TaskLog[];
    meta: IListLogsMeta;
}

export interface IListLogsGateway {
    execute(input: IListLogsInput): Promise<IListLogsOutput>;
}

export const ListLogsGateway = createAbstraction<IListLogsGateway>("ListLogsGateway");

export namespace ListLogsGateway {
    export type Interface = IListLogsGateway;
}

export interface IListLogsUseCase {
    execute(input: IListLogsInput): Promise<IListLogsOutput>;
}

export const ListLogsUseCase = createAbstraction<IListLogsUseCase>("ListLogsUseCase");

export namespace ListLogsUseCase {
    export type Interface = IListLogsUseCase;
}
