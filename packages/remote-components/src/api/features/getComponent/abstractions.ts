import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError
} from "~/api/domain/errors.js";

type IError = RemoteComponentNotFoundError | RemoteComponentPersistenceError;

export interface IGetRemoteComponentUseCase {
    execute(id: string): Promise<Result<RemoteComponentDto, IError>>;
}

export const GetRemoteComponentUseCase = createAbstraction<IGetRemoteComponentUseCase>(
    "RemoteComponents/GetRemoteComponentUseCase"
);

export namespace GetRemoteComponentUseCase {
    export type Interface = IGetRemoteComponentUseCase;
    export type Error = IError;
}

export interface IGetRemoteComponentRepository {
    execute(id: string): Promise<Result<RemoteComponentDto, IError>>;
}

export const GetRemoteComponentRepository = createAbstraction<IGetRemoteComponentRepository>(
    "RemoteComponents/GetRemoteComponentRepository"
);

export namespace GetRemoteComponentRepository {
    export type Interface = IGetRemoteComponentRepository;
    export type Error = IError;
}
