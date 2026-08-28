import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    ICollabLocatorResolution,
    ICollabLocatorResolveParams
} from "~/domain/locator/abstractions.js";
import type { CollabResolverNotFoundError } from "~/domain/locator/errors.js";

export interface IResolveLocatorUseCaseErrors {
    resolverNotFound: CollabResolverNotFoundError;
}

type UseCaseError = IResolveLocatorUseCaseErrors[keyof IResolveLocatorUseCaseErrors];

export interface IResolveLocatorUseCase {
    execute(
        params: ICollabLocatorResolveParams
    ): Promise<Result<ICollabLocatorResolution, UseCaseError>>;
}

export const ResolveLocatorUseCase =
    createAbstraction<IResolveLocatorUseCase>("ResolveLocatorUseCase");

export namespace ResolveLocatorUseCase {
    export type Interface = IResolveLocatorUseCase;
    export type Params = ICollabLocatorResolveParams;
    export type Resolution = ICollabLocatorResolution;
    export type Return = Promise<Result<ICollabLocatorResolution, UseCaseError>>;
    export type Error = UseCaseError;
}
