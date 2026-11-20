import { createAbstraction } from "@webiny/feature/admin";
import type { GlobalComponentRecord } from "@webiny/website-builder-sdk";

// Params
export interface SaveGlobalComponentParams {
    // One global component in one language; it replaces that component's record in that language and no other.
    globalComponent: GlobalComponentRecord;
}

// UseCase
export interface ISaveGlobalComponentUseCase {
    execute(params: SaveGlobalComponentParams): Promise<GlobalComponentRecord>;
}

export const SaveGlobalComponentUseCase = createAbstraction<ISaveGlobalComponentUseCase>(
    "WebsiteBuilder/SaveGlobalComponentUseCase"
);
export namespace SaveGlobalComponentUseCase {
    export type Interface = ISaveGlobalComponentUseCase;
    export type Params = SaveGlobalComponentParams;
}

// Repository
export interface ISaveGlobalComponentRepository {
    execute(globalComponent: GlobalComponentRecord): Promise<GlobalComponentRecord>;
}

export const SaveGlobalComponentRepository = createAbstraction<ISaveGlobalComponentRepository>(
    "WebsiteBuilder/SaveGlobalComponentRepository"
);
export namespace SaveGlobalComponentRepository {
    export type Interface = ISaveGlobalComponentRepository;
}

// Gateway
export interface ISaveGlobalComponentGateway {
    execute(globalComponent: GlobalComponentRecord): Promise<GlobalComponentRecord>;
}

export const SaveGlobalComponentGateway = createAbstraction<ISaveGlobalComponentGateway>(
    "WebsiteBuilder/SaveGlobalComponentGateway"
);
export namespace SaveGlobalComponentGateway {
    export type Interface = ISaveGlobalComponentGateway;
}
