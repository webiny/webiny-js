import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RemoteComponentDto } from "~/shared/types.js";
import type {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError,
    RemoteComponentBundleError,
    RemoteComponentNotAuthorizedError
} from "~/api/domain/errors.js";

type IError =
    | RemoteComponentNotFoundError
    | RemoteComponentPersistenceError
    | RemoteComponentBundleError
    | RemoteComponentNotAuthorizedError;

export interface IBundleRemoteComponentUseCase {
    execute(id: string): Promise<Result<RemoteComponentDto, IError>>;
}

export const BundleRemoteComponentUseCase = createAbstraction<IBundleRemoteComponentUseCase>(
    "RemoteComponents/BundleRemoteComponentUseCase"
);

export namespace BundleRemoteComponentUseCase {
    export type Interface = IBundleRemoteComponentUseCase;
    export type Error = IError;
}
