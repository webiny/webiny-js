import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import {
    BackgroundTaskInputHandler,
    InputHandler,
    SCHEDULED_ACTION_EVENT_IDENTIFIER,
    ScheduledActionInputHandler
} from "@webiny/api-kernel-core";
import type { InputChainRunner } from "@webiny/api-kernel-core";
import { BackgroundTaskTenantSource } from "~/features/tenancy/TenantScopes/BackgroundTaskTenantSource.js";
import { ScheduledActionTenantSource } from "~/features/tenancy/TenantScopes/ScheduledActionTenantSource.js";

const request = (abstraction: any, event: any): InputChainRunner.Request => {
    return { container: new Container(), abstraction, input: event };
};

describe("BackgroundTaskTenantSource", () => {
    const source = new (BackgroundTaskTenantSource as any)();

    it("runs a task in the tenant of its event", () => {
        const event = { webinyTaskId: "task-1", tenant: "my-tenant" };
        expect(source.getTenant(request(BackgroundTaskInputHandler, event))).toEqual({
            tenantId: "my-tenant"
        });
    });

    it("unwraps the payload Step Functions wraps the task event in", () => {
        const event = { name: "WebinyBackgroundTask", payload: { tenant: "wrapped-tenant" } };
        expect(source.getTenant(request(BackgroundTaskInputHandler, event))).toEqual({
            tenantId: "wrapped-tenant"
        });
    });

    it("runs a task without a tenant as the root tenant", () => {
        expect(source.getTenant(request(BackgroundTaskInputHandler, {}))).toEqual({
            tenantId: null
        });
    });

    it("doesn't know other events", () => {
        expect(source.getTenant(request(InputHandler, { tenant: "x" }))).toBeUndefined();
    });
});

describe("ScheduledActionTenantSource", () => {
    const source = new (ScheduledActionTenantSource as any)();

    it("runs an action in the tenant it was scheduled in", () => {
        const event = { [SCHEDULED_ACTION_EVENT_IDENTIFIER]: { id: "a", tenant: "acme" } };
        expect(source.getTenant(request(ScheduledActionInputHandler, event))).toEqual({
            tenantId: "acme"
        });
    });

    it("runs an action scheduled before the payload had a tenant as the root tenant", () => {
        const event = { [SCHEDULED_ACTION_EVENT_IDENTIFIER]: { id: "a" } };
        expect(source.getTenant(request(ScheduledActionInputHandler, event))).toEqual({
            tenantId: null
        });
    });
});
