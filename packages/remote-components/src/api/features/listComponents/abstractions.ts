import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type {
    RemoteComponentPersistenceError,
    RemoteComponentNotFoundError
} from "~/api/domain/errors.js";

export interface IListRemoteComponentsMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListRemoteComponentsOutput {
    items: RemoteComponentDto[];
    meta: IListRemoteComponentsMeta;
}

type IError = RemoteComponentPersistenceError | RemoteComponentNotFoundError;

export interface IListRemoteComponentsUseCase {
    execute(): Promise<Result<IListRemoteComponentsOutput, IError>>;
}

export const ListRemoteComponentsUseCase = createAbstraction<IListRemoteComponentsUseCase>(
    "RemoteComponents/ListRemoteComponentsUseCase"
);

export namespace ListRemoteComponentsUseCase {
    export type Interface = IListRemoteComponentsUseCase;
    export type Output = IListRemoteComponentsOutput;
    export type Error = IError;
}

export interface IListRemoteComponentsRepository {
    execute(): Promise<Result<IListRemoteComponentsOutput, IError>>;
}

export const ListRemoteComponentsRepository = createAbstraction<IListRemoteComponentsRepository>(
    "RemoteComponents/ListRemoteComponentsRepository"
);

export namespace ListRemoteComponentsRepository {
    export type Interface = IListRemoteComponentsRepository;
    export type Output = IListRemoteComponentsOutput;
    export type Error = IError;
}
