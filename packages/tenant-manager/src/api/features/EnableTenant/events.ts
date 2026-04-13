import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Tenant } from "~/shared/Tenant.js";

export interface TenantBeforeEnablePayload {
    tenant: Tenant;
}

export interface TenantAfterEnablePayload {
    tenant: Tenant;
}

export class TenantBeforeEnableEvent extends DomainEvent<TenantBeforeEnablePayload> {
    eventType = "tenant.beforeEnable" as const;

    getHandlerAbstraction() {
        return TenantBeforeEnableEventHandler;
    }
}

export const TenantBeforeEnableEventHandler = createAbstraction<
    IEventHandler<TenantBeforeEnableEvent>
>("TenantManager/TenantBeforeEnableEventHandler");

export namespace TenantBeforeEnableEventHandler {
    export type Interface = IEventHandler<TenantBeforeEnableEvent>;
    export type Event = TenantBeforeEnableEvent;
}

export class TenantAfterEnableEvent extends DomainEvent<TenantAfterEnablePayload> {
    eventType = "tenant.afterEnable" as const;

    getHandlerAbstraction() {
        return TenantAfterEnableEventHandler;
    }
}

export const TenantAfterEnableEventHandler = createAbstraction<
    IEventHandler<TenantAfterEnableEvent>
>("TenantManager/TenantAfterEnableEventHandler");

export namespace TenantAfterEnableEventHandler {
    export type Interface = IEventHandler<TenantAfterEnableEvent>;
    export type Event = TenantAfterEnableEvent;
}
