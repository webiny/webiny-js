import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGetWcpProjectEnvironmentApiKeyService {
    execute(): Promise<string | null>;
}

export const GetWcpProjectEnvironmentApiKeyService =
    createAbstraction<IGetWcpProjectEnvironmentApiKeyService>(
        "GetWcpProjectEnvironmentApiKeyService"
    );

export namespace GetWcpProjectEnvironmentApiKeyService {
    export type Interface = IGetWcpProjectEnvironmentApiKeyService;
}
