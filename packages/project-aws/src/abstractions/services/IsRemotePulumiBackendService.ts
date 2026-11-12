import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

export interface IIsRemotePulumiBackendService {
    execute(): boolean;
}

export const IsRemotePulumiBackendService = createAbstraction<IIsRemotePulumiBackendService>(
    "IsRemotePulumiBackendService"
);

export namespace IsRemotePulumiBackendService {
    export type Interface = IIsRemotePulumiBackendService;
}
