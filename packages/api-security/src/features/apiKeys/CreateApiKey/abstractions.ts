import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey, CreateApiKeyInput } from "../shared/types.js";

export interface ICreateApiKey {
    execute(input: CreateApiKeyInput): Promise<Result<ApiKey, Error>>;
}

export const CreateApiKey = createAbstraction<ICreateApiKey>("CreateApiKey");

export namespace CreateApiKey {
    export type Interface = ICreateApiKey;
}

export interface ApiKeyBeforeCreatePayload {
    apiKey: ApiKey;
    input: CreateApiKeyInput;
}

export interface ApiKeyAfterCreatePayload {
    apiKey: ApiKey;
    input: CreateApiKeyInput;
}
