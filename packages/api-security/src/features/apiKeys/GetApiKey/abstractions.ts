import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ApiKey } from "../shared/types.js";

export interface IGetApiKey {
    execute(id: string): Promise<Result<ApiKey | null, Error>>;
}

export const GetApiKey = createAbstraction<IGetApiKey>("GetApiKey");

export namespace GetApiKey {
    export type Interface = IGetApiKey;
}
