import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";

export interface IGetApiKeyBySlugErrors {
    // No use-case specific errors - only repository errors can occur
}

type GetApiKeyBySlugError =
    | IGetApiKeyBySlugErrors[keyof IGetApiKeyBySlugErrors]
    | ApiKeysRepository.Error;

export interface IGetApiKeyBySlug {
    execute(slug: string): Promise<Result<ApiKey | null, GetApiKeyBySlugError>>;
}

export const GetApiKeyBySlug = createAbstraction<IGetApiKeyBySlug>("GetApiKeyBySlug");

export namespace GetApiKeyBySlug {
    export type Interface = IGetApiKeyBySlug;
    export type Error = GetApiKeyBySlugError;
}
