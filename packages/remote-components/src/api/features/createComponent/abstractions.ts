import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type { ComponentBundle } from "~/api/bundler/types.js";
import type { StoredBundleValues } from "~/api/features/shared/storedBundleValues.js";
import type {
    RemoteComponentPersistenceError,
    RemoteComponentNotFoundError,
    RemoteComponentNotAuthorizedError,
    RemoteComponentInvalidBundleError
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
    /**
     * A bundle built outside the API, from `bundleComponent`. When present it is validated against
     * `name`, `source` and `css` and stored with the component; when absent the component is stored
     * without a bundle, as before.
     */
    bundle?: ComponentBundle | null;
}

export interface ICreateRemoteComponentRepositoryInput
    extends Omit<ICreateRemoteComponentInput, "bundle">, Partial<StoredBundleValues> {}

type IError =
    | RemoteComponentPersistenceError
    | RemoteComponentNotFoundError
    | RemoteComponentNotAuthorizedError
    | RemoteComponentInvalidBundleError;

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
    execute(
        input: ICreateRemoteComponentRepositoryInput
    ): Promise<Result<RemoteComponentDto, IError>>;
}

export const CreateRemoteComponentRepository = createAbstraction<ICreateRemoteComponentRepository>(
    "RemoteComponents/CreateRemoteComponentRepository"
);

export namespace CreateRemoteComponentRepository {
    export type Interface = ICreateRemoteComponentRepository;
    export type Input = ICreateRemoteComponentRepositoryInput;
    export type Error = IError;
}
