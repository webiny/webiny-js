import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";

export interface IGetApiKeyByTokenErrors {
    // No use-case specific errors - only repository errors can occur
}

type GetApiKeyByTokenError =
    | IGetApiKeyByTokenErrors[keyof IGetApiKeyByTokenErrors]
    | ApiKeysRepository.Error;

export interface IGetApiKeyByToken {
    execute(token: string): Promise<Result<ApiKey | null, GetApiKeyByTokenError>>;
}

export const GetApiKeyByToken = createAbstraction<IGetApiKeyByToken>("GetApiKeyByToken");

export namespace GetApiKeyByToken {
    export type Interface = IGetApiKeyByToken;
    export type Error = GetApiKeyByTokenError;
}
