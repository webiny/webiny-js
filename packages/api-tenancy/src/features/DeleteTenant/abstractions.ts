import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core";
import type { TenantBeforeDeleteEvent, TenantAfterDeleteEvent } from "./events.js";

export interface IDeleteTenantUseCase {
    execute(id: string): Promise<boolean>;
}

export const DeleteTenantUseCase = createAbstraction<IDeleteTenantUseCase>("DeleteTenantUseCase");

export namespace DeleteTenantUseCase {
    export type Interface = IDeleteTenantUseCase;
}

export interface IDeleteTenantRepository {
    delete(id: string): Promise<void>;
}

export const DeleteTenantRepository =
    createAbstraction<IDeleteTenantRepository>("DeleteTenantRepository");

export namespace DeleteTenantRepository {
    export type Interface = IDeleteTenantRepository;
}

export interface IDeleteTenantGateway {
    deleteTenant(id: string): Promise<void>;
}

export const DeleteTenantGateway = createAbstraction<IDeleteTenantGateway>("DeleteTenantGateway");

export namespace DeleteTenantGateway {
    export type Interface = IDeleteTenantGateway;
}

export const TenantBeforeDeleteHandler = createAbstraction<IEventHandler<TenantBeforeDeleteEvent>>(
    "TenantBeforeDeleteHandler"
);

export namespace TenantBeforeDeleteHandler {
    export type Interface = IEventHandler<TenantBeforeDeleteEvent>;
}

export const TenantAfterDeleteHandler = createAbstraction<IEventHandler<TenantAfterDeleteEvent>>(
    "TenantAfterDeleteHandler"
);

export namespace TenantAfterDeleteHandler {
    export type Interface = IEventHandler<TenantAfterDeleteEvent>;
}
