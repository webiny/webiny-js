import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type {
    RemoteComponentPersistenceError,
    RemoteComponentNotFoundError
} from "~/api/domain/errors.js";

export interface ICreateRemoteComponentInput {
    name: string;
    label: string;
    description?: string;
    aiContext?: string;
    source: string;
    css?: string;
    aiPrompt?: string;
    status?: string;
}

type IError = RemoteComponentPersistenceError | RemoteComponentNotFoundError;

export interface ICreateRemoteComponentUseCase {
    execute(input: ICreateRemoteComponentInput): Promise<Result<RemoteComponentDto, IError>>;
}

export const CreateRemoteComponentUseCase = createAbstraction<ICreateRemoteComponentUseCase>(
    "RemoteComponents/CreateRemoteComponentUseCase"
);

export namespace CreateRemoteComponentUseCase {
    export type Interface = ICreateRemoteComponentUseCase;
    export type Input = ICreateRemoteComponentInput;
    export type Error = IError;
}

export interface ICreateRemoteComponentRepository {
    execute(input: ICreateRemoteComponentInput): Promise<Result<RemoteComponentDto, IError>>;
}

export const CreateRemoteComponentRepository = createAbstraction<ICreateRemoteComponentRepository>(
    "RemoteComponents/CreateRemoteComponentRepository"
);

export namespace CreateRemoteComponentRepository {
    export type Interface = ICreateRemoteComponentRepository;
    export type Error = IError;
}
