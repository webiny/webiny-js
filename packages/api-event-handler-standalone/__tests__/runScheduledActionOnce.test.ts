import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ScheduledActionEventHandler } from "@webiny/event-handler-core";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/event-handler-core";
import type { IScheduledActionEvent } from "@webiny/event-handler-core";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyNotFoundError } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyValueConditionFailedError } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetScheduledActionUseCase } from "@webiny/api-scheduler/features/GetScheduledAction/index.js";
import { RunScheduledActionOnceDecorator } from "~/scheduler/RunScheduledActionOnceDecorator.js";

interface IStoredRecord {
    value: unknown;
    expiresAt?: Date;
}

/*
 * The global key-value store's `exists: false` condition and expiry, kept in memory and shared by
 * the "processes" of one test, as one database would be.
 */
const createStore = (): GlobalKeyValueStore.Interface => {
    const records = new Map<string, IStoredRecord>();
    const isLive = (record: IStoredRecord | undefined): record is IStoredRecord => {
        return Boolean(record) && (!record!.expiresAt || record!.expiresAt.getTime() > Date.now());
    };
    return {
        async get(key) {
            const record = records.get(key);
            if (!isLive(record)) {
                return Result.fail(new KeyNotFoundError(key));
            }
            return Result.ok(record.value as any);
        },
        async set(key, value, options) {
            const scopedKey = `${options?.scope}:${key}`;
            if (options?.condition?.exists === false && isLive(records.get(scopedKey))) {
                return Result.fail(new KeyValueConditionFailedError(key));
            }
            records.set(scopedKey, { value, expiresAt: options?.expiresAt });
            return Result.ok();
        },
        async delete() {
            return Result.ok();
        },
        async list() {
            return Result.ok({ items: [], cursor: null });
        }
    };
};

interface IActionState {
    // `null` when the action was cancelled or already ran.
    scheduledFor: Date | null;
}

const event: IScheduledActionEvent = {
    [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
        id: "action-1",
        namespace: "Cms/Entry/Article",
        tenant: "root",
        scheduleFor: new Date().toISOString()
    }
};

/*
 * One process's handler chain: the decorator around a decoratee that records each run. `action` is
 * shared, as the stored action would be.
 */
const createProcess = (store: GlobalKeyValueStore.Interface, action: IActionState) => {
    const runs = vi.fn(async () => ({ success: true }));
    const container = new Container();
    const tenant = { id: "root", name: "root" };
    container.registerInstance(GetTenantByIdUseCase, {
        execute: async () => Result.ok(tenant as any)
    } as unknown as GetTenantByIdUseCase.Interface);
    container.registerInstance(TenantContext, {
        getTenant: () => tenant,
        withTenant: async (_tenant: unknown, cb: () => Promise<unknown>) => cb()
    } as unknown as TenantContext.Interface);
    container.registerInstance(IdentityContext, {
        withoutAuthorization: (cb: () => Promise<unknown>) => cb()
    } as unknown as IdentityContext.Interface);
    container.registerInstance(GetScheduledActionUseCase, {
        execute: async () => {
            if (!action.scheduledFor) {
                return Result.fail({ code: "Scheduler/ScheduledAction/NotFound" } as any);
            }
            return Result.ok({ scheduledFor: action.scheduledFor } as any);
        }
    } as unknown as GetScheduledActionUseCase.Interface);
    container.registerInstance(GlobalKeyValueStore, store);
    container.registerInstance(ScheduledActionEventHandler, { execute: runs });
    container.registerDecorator(RunScheduledActionOnceDecorator);

    const handler = container.resolve(ScheduledActionEventHandler);
    const next = async () => undefined;
    const fire = () => handler.execute({ event } as any, next);

    return { fire, runs };
};

afterEach(() => {
    vi.useRealTimers();
});

describe("RunScheduledActionOnceDecorator", () => {
    it("runs an action that is due", async () => {
        const action = { scheduledFor: new Date() };
        const a = createProcess(createStore(), action);

        await a.fire();

        expect(a.runs).toHaveBeenCalledTimes(1);
    });

    it("runs an action once when every process fires it", async () => {
        const store = createStore();
        const action = { scheduledFor: new Date() };
        const a = createProcess(store, action);
        const b = createProcess(store, action);

        await Promise.all([a.fire(), b.fire()]);

        expect(a.runs.mock.calls.length + b.runs.mock.calls.length).toBe(1);
    });

    it("does nothing for an action that was cancelled or already ran", async () => {
        const a = createProcess(createStore(), { scheduledFor: null });

        const result = await a.fire();

        expect(result).toEqual({ success: true });
        expect(a.runs).not.toHaveBeenCalled();
    });

    // Another process moved the action later; this process's timer for the old time is stale.
    it("skips a stale timer for an action now due later", async () => {
        const later = new Date(Date.now() + 60_000);
        const a = createProcess(createStore(), { scheduledFor: later });

        await a.fire();

        expect(a.runs).not.toHaveBeenCalled();
    });

    it("runs a rescheduled action again at its new time", async () => {
        const store = createStore();
        const action: IActionState = { scheduledFor: new Date(Date.now() - 1000) };
        const a = createProcess(store, action);
        await a.fire();

        action.scheduledFor = new Date();
        await a.fire();

        expect(a.runs).toHaveBeenCalledTimes(2);
    });

    it("leaves a failed action alone for a day, then tries it again", async () => {
        vi.useFakeTimers();
        const store = createStore();
        const action = { scheduledFor: new Date() };
        const a = createProcess(store, action);
        const b = createProcess(store, action);
        a.runs.mockRejectedValueOnce(new Error("publish failed"));

        await expect(a.fire()).rejects.toThrow("publish failed");
        vi.advanceTimersByTime(60 * 60_000);
        await b.fire();
        expect(b.runs).not.toHaveBeenCalled();

        vi.advanceTimersByTime(24 * 60 * 60_000);
        await b.fire();
        expect(b.runs).toHaveBeenCalledTimes(1);
    });
});
