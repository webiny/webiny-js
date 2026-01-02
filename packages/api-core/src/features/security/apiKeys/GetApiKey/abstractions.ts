import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey } from "../shared/types.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import type { NotAuthorizedError } from "~/features/security/apiKeys/shared/errors.js";

export interface IGetApiKeyErrors {
    notAuthorized: NotAuthorizedError;
}

type GetApiKeyError = IGetApiKeyErrors[keyof IGetApiKeyErrors] | ApiKeysRepository.Error;

export interface IGetApiKey {
    execute(id: string): Promise<Result<ApiKey | null, GetApiKeyError>>;
}

export const GetApiKey = createAbstraction<IGetApiKey>("GetApiKey");

export namespace GetApiKey {
    export type Interface = IGetApiKey;
    export type Error = GetApiKeyError;
}
