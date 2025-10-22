import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey } from "../shared/types.js";

export interface IGetApiKeyByToken {
    execute(token: string): Promise<Result<ApiKey | null, Error>>;
}

export const GetApiKeyByToken = createAbstraction<IGetApiKeyByToken>("GetApiKeyByToken");

export namespace GetApiKeyByToken {
    export type Interface = IGetApiKeyByToken;
}
