import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError,
    RemoteComponentNotAuthorizedError
} from "~/api/domain/errors.js";

type IError =
    | RemoteComponentNotFoundError
    | RemoteComponentPersistenceError
    | RemoteComponentNotAuthorizedError;

export interface IDeleteRemoteComponentUseCase {
    execute(id: string): Promise<Result<boolean, IError>>;
}

export const DeleteRemoteComponentUseCase = createAbstraction<IDeleteRemoteComponentUseCase>(
    "RemoteComponents/DeleteRemoteComponentUseCase"
);

export namespace DeleteRemoteComponentUseCase {
    export type Interface = IDeleteRemoteComponentUseCase;
    export type Error = IError;
}

export interface IDeleteRemoteComponentRepository {
    execute(id: string): Promise<Result<boolean, IError>>;
}

export const DeleteRemoteComponentRepository = createAbstraction<IDeleteRemoteComponentRepository>(
    "RemoteComponents/DeleteRemoteComponentRepository"
);

export namespace DeleteRemoteComponentRepository {
    export type Interface = IDeleteRemoteComponentRepository;
    export type Error = IError;
}
