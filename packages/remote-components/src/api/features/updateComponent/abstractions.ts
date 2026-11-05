import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type { ComponentBundle } from "~/api/bundler/types.js";
import type {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError,
    RemoteComponentNotAuthorizedError,
    RemoteComponentInvalidBundleError
} from "~/api/domain/errors.js";

export interface IUpdateRemoteComponentInput {
    name?: string;
    label?: string;
    description?: string;
    source?: string;
    css?: string;
    bundledJs?: string;
    bundledJsSha256?: string;
    bundledCss?: string;
    bundledCssSha256?: string;
    aiPrompt?: string;
    status?: string;
    /**
     * A bundle built outside the API, from `bundleComponent`. It is validated against the component's
     * name, source and CSS after this update, and can't be combined with the flat `bundled*` fields,
     * which are stored as given.
     */
    bundle?: ComponentBundle | null;
}

type IRepositoryError =
    | RemoteComponentNotFoundError
    | RemoteComponentPersistenceError
    | RemoteComponentNotAuthorizedError;

type IError = IRepositoryError | RemoteComponentInvalidBundleError;

export interface IUpdateRemoteComponentUseCase {
    execute(
        id: string,
        input: IUpdateRemoteComponentInput
    ): Promise<Result<RemoteComponentDto, IError>>;
}

export const UpdateRemoteComponentUseCase = createAbstraction<IUpdateRemoteComponentUseCase>(
    "RemoteComponents/UpdateRemoteComponentUseCase"
);

export namespace UpdateRemoteComponentUseCase {
    export type Interface = IUpdateRemoteComponentUseCase;
    export type Input = IUpdateRemoteComponentInput;
    export type Error = IError;
}

export interface IUpdateRemoteComponentRepository {
    execute(
        id: string,
        values: Record<string, any>
    ): Promise<Result<RemoteComponentDto, IRepositoryError>>;
}

export const UpdateRemoteComponentRepository = createAbstraction<IUpdateRemoteComponentRepository>(
    "RemoteComponents/UpdateRemoteComponentRepository"
);

export namespace UpdateRemoteComponentRepository {
    export type Interface = IUpdateRemoteComponentRepository;
    export type Error = IRepositoryError;
}
