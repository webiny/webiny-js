import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type { PrebuiltBundle } from "~/shared/bundler/types.js";
import type {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError
} from "~/api/domain/errors.js";

/**
 * What a caller may change about a component. Deliberately excludes `bundledJs`, its sha, the
 * bundled CSS and the manifest: those are derived from the source, and the only thing that writes
 * them is the bundler, through `UpdateRemoteComponentRepository`. A caller that could set them could
 * store a bundle that does not correspond to the source beside it.
 */
export interface IUpdateRemoteComponentInput {
    name?: string;
    label?: string;
    description?: string;
    source?: string;
    css?: string;
    aiPrompt?: string;
    /** Only Promote's Replace path supplies this — see `PrebuiltBundle`. */
    bundle?: PrebuiltBundle;
}

type IError = RemoteComponentNotFoundError | RemoteComponentPersistenceError;

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
    execute(id: string, values: Record<string, any>): Promise<Result<RemoteComponentDto, IError>>;
}

export const UpdateRemoteComponentRepository = createAbstraction<IUpdateRemoteComponentRepository>(
    "RemoteComponents/UpdateRemoteComponentRepository"
);

export namespace UpdateRemoteComponentRepository {
    export type Interface = IUpdateRemoteComponentRepository;
    export type Error = IError;
}
