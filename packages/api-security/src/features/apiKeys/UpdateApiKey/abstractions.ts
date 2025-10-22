import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey, UpdateApiKeyInput } from "../shared/types.js";

export interface IUpdateApiKey {
    execute(id: string, input: UpdateApiKeyInput): Promise<Result<ApiKey, Error>>;
}

export const UpdateApiKey = createAbstraction<IUpdateApiKey>("UpdateApiKey");

export namespace UpdateApiKey {
    export type Interface = IUpdateApiKey;
}

export interface ApiKeyBeforeUpdatePayload {
    original: ApiKey;
    updated: ApiKey;
    input: UpdateApiKeyInput;
}

export interface ApiKeyAfterUpdatePayload {
    original: ApiKey;
    updated: ApiKey;
    input: UpdateApiKeyInput;
}
