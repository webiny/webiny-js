import { createAbstraction } from "@webiny/feature/admin";
import type { FmTag } from "../shared/types.js";
import type { FmTagsListWhereInput } from "@webiny/sdk";

// Gateway — performs the API call via @webiny/sdk.
export interface IListTagsGateway {
    execute(params: ListTagsGatewayParams): Promise<ListTagsGatewayResult>;
}

export interface ListTagsGatewayParams {
    where?: FmTagsListWhereInput;
}

export type ListTagsGatewayResult = FmTag[];

export const ListTagsGateway = createAbstraction<IListTagsGateway>("ListTagsGateway");

export namespace ListTagsGateway {
    export type Interface = IListTagsGateway;
}

// Repository — manages cached tag list state and delegates I/O to the gateway.
export interface IListTagsRepository {
    execute(params: ListTagsGatewayParams): Promise<ListTagsGatewayResult>;
    readonly tags: FmTag[];
}

export const ListTagsRepository = createAbstraction<IListTagsRepository>("ListTagsRepository");

export namespace ListTagsRepository {
    export type Interface = IListTagsRepository;
}

// UseCase — orchestrates a single list-tags operation.
export interface ListTagsUseCaseParams {
    where?: FmTagsListWhereInput;
}

export type ListTagsUseCaseResult = FmTag[];

export interface IListTagsUseCase {
    execute(params?: ListTagsUseCaseParams): Promise<ListTagsUseCaseResult>;
}

export const ListTagsUseCase = createAbstraction<IListTagsUseCase>("ListTagsUseCase");

export namespace ListTagsUseCase {
    export type Interface = IListTagsUseCase;
}
