import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Tenant } from "~/shared/Tenant.js";

export interface TenantBeforeDisablePayload {
    tenant: Tenant;
}

export interface TenantAfterDisablePayload {
    tenant: Tenant;
}

export class TenantBeforeDisableEvent extends DomainEvent<TenantBeforeDisablePayload> {
    eventType = "tenant.beforeDisable" as const;

    getHandlerAbstraction() {
        return TenantBeforeDisableEventHandler;
    }
}

export const TenantBeforeDisableEventHandler = createAbstraction<
    IEventHandler<TenantBeforeDisableEvent>
>("TenantManager/TenantBeforeDisableEventHandler");

export namespace TenantBeforeDisableEventHandler {
    export type Interface = IEventHandler<TenantBeforeDisableEvent>;
    export type Event = TenantBeforeDisableEvent;
}

export class TenantAfterDisableEvent extends DomainEvent<TenantAfterDisablePayload> {
    eventType = "tenant.afterDisable" as const;

    getHandlerAbstraction() {
        return TenantAfterDisableEventHandler;
    }
}

export const TenantAfterDisableEventHandler = createAbstraction<
    IEventHandler<TenantAfterDisableEvent>
>("TenantManager/TenantAfterDisableEventHandler");

export namespace TenantAfterDisableEventHandler {
    export type Interface = IEventHandler<TenantAfterDisableEvent>;
    export type Event = TenantAfterDisableEvent;
}
