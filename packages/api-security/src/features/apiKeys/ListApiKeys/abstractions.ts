import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ListApiKeysInput } from "../shared/types.js";
import type { ApiKey } from "~/types.js";

export interface IListApiKeys {
    execute(params: ListApiKeysInput): Promise<Result<ApiKey[], Error>>;
}

export const ListApiKeys = createAbstraction<IListApiKeys>("ListApiKeys");

export namespace ListApiKeys {
    export type Interface = IListApiKeys;
}
