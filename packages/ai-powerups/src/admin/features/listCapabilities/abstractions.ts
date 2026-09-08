import { createAbstraction } from "@webiny/feature/admin";

export interface AiCapability {
    id: string;
    label: string;
    description: string;
    defaultRole: string;
    /** Null when the capability's prompt is assembled per request and cannot be replaced. */
    guidance: string | null;
}

export interface IListCapabilitiesGateway {
    execute(): Promise<AiCapability[]>;
}

export const ListCapabilitiesGateway = createAbstraction<IListCapabilitiesGateway>(
    "AiPowerUps/ListCapabilitiesGateway"
);
export namespace ListCapabilitiesGateway {
    export type Interface = IListCapabilitiesGateway;
}

export interface IListCapabilitiesRepository {
    execute(): Promise<void>;
    getCapabilities(): AiCapability[];
}

export const ListCapabilitiesRepository = createAbstraction<IListCapabilitiesRepository>(
    "AiPowerUps/ListCapabilitiesRepository"
);
export namespace ListCapabilitiesRepository {
    export type Interface = IListCapabilitiesRepository;
}

export interface IListCapabilitiesUseCase {
    execute(): Promise<void>;
}

export const ListCapabilitiesUseCase = createAbstraction<IListCapabilitiesUseCase>(
    "AiPowerUps/ListCapabilitiesUseCase"
);
export namespace ListCapabilitiesUseCase {
    export type Interface = IListCapabilitiesUseCase;
}
