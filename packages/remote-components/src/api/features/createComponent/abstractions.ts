import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type { PrebuiltBundle } from "~/shared/bundler/types.js";
import type {
    RemoteComponentPersistenceError,
    RemoteComponentNotFoundError
} from "~/api/domain/errors.js";

/**
 * `status` is absent on purpose. It is a transition, not a property a caller sets — see
 * `shared/componentStatus.ts`. A create yields `draft`, or `bundled` when `bundle` is supplied.
 */
export interface ICreateRemoteComponentInput {
    name: string;
    label: string;
    description?: string;
    aiContext?: string;
    source: string;
    css?: string;
    aiPrompt?: string;
    bundle?: PrebuiltBundle;
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
