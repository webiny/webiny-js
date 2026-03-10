import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "~/features/eventPublisher/index.js";
import type { TenantBeforeDeletePayload, TenantAfterDeletePayload } from "./events.js";

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

export const TenantBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TenantBeforeDeletePayload>>
>("TenantBeforeDeleteEventHandler");

export namespace TenantBeforeDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<TenantBeforeDeletePayload>>;
    export type Event = DomainEvent<TenantBeforeDeletePayload>;
}

export const TenantAfterDeleteEventHandler = createAbstraction<
    IEventHandler<DomainEvent<TenantAfterDeletePayload>>
>("TenantAfterDeleteEventHandler");

export namespace TenantAfterDeleteEventHandler {
    export type Interface = IEventHandler<DomainEvent<TenantAfterDeletePayload>>;
    export type Event = DomainEvent<TenantAfterDeletePayload>;
}
