import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";
import type { IBreeSchedulerServiceParams } from "~/BreeSchedulerService.js";
import { createMockLogger } from "./createMockLogger.js";

const futureDate = (ms: number) => new Date(Date.now() + ms);
const pastDate = (ms: number) => new Date(Date.now() - ms);

/*
 * With several processes, recovery runs every minute and passes the same actions again, so recover
 * has to be safe to repeat, and pick up an action another process moved.
 */
describe("BreeSchedulerService — repeated recovery and shutdown", () => {
    const namespace = "Test/SomeEntry";
    const tenant = "root";
    let service: BreeSchedulerService;
    let runAction: IBreeSchedulerServiceParams["runAction"];

    afterEach(async () => {
        await service.stop();
    });

    const createService = (trigger?: IBreeSchedulerServiceParams["runAction"]) => {
        runAction = trigger ?? vi.fn().mockResolvedValue(undefined);
        service = new BreeSchedulerService({ logger: createMockLogger(), runAction });
        return service;
    };

    it("leaves an action armed for the same time as it is", async () => {
        const svc = createService();
        await svc.start();
        const scheduledFor = futureDate(60_000);
        const action = { id: "a-1", namespace, tenant, scheduledFor };

        await svc.recover([action]);
        await svc.recover([action]);

        expect(await svc.exists({ id: "a-1", namespace, tenant })).toBe(true);
    });

    // Another process moved it: the stale timer goes, a timer for the new time replaces it.
    it("re-arms an action whose time changed", async () => {
        const svc = createService();
        await svc.start();
        await svc.recover([{ id: "a-1", namespace, tenant, scheduledFor: futureDate(2_000) }]);

        await svc.recover([{ id: "a-1", namespace, tenant, scheduledFor: futureDate(60_000) }]);
        await new Promise(resolve => setTimeout(resolve, 3_000));

        expect(runAction).not.toHaveBeenCalled();
        expect(await svc.exists({ id: "a-1", namespace, tenant })).toBe(true);
    });

    it("waits for a running trigger, then resolves", async () => {
        let finish: () => void = () => {};
        const svc = createService(
            vi.fn(
                () =>
                    new Promise<void>(resolve => {
                        finish = resolve;
                    })
            )
        );
        await svc.start();
        void svc.recover([{ id: "a-1", namespace, tenant, scheduledFor: pastDate(1_000) }]);
        await vi.waitFor(() => expect(runAction).toHaveBeenCalled());

        let done = false;
        void svc.waitForRunning(5_000).then(() => {
            done = true;
        });
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(done).toBe(false);

        finish();
        await vi.waitFor(() => expect(done).toBe(true));
    });

    it("stops waiting at the timeout", async () => {
        const svc = createService(vi.fn(() => new Promise<void>(() => {})));
        await svc.start();
        void svc.recover([{ id: "a-1", namespace, tenant, scheduledFor: pastDate(1_000) }]);
        await vi.waitFor(() => expect(runAction).toHaveBeenCalled());

        const started = Date.now();
        await svc.waitForRunning(100);

        expect(Date.now() - started).toBeLessThan(1_000);
    });

    // A recovery started before the shutdown keeps going after stop(); it must not start more.
    it("starts and arms nothing once stopped, even in a recovery already running", async () => {
        let finishFirst: () => void = () => {};
        const svc = createService(
            vi.fn((id: string) => {
                if (id === "overdue-1") {
                    return new Promise<void>(resolve => {
                        finishFirst = resolve;
                    });
                }
                return Promise.resolve();
            })
        );
        await svc.start();

        const recovering = svc.recover([
            { id: "overdue-1", namespace, tenant, scheduledFor: pastDate(2_000) },
            { id: "overdue-2", namespace, tenant, scheduledFor: pastDate(1_000) },
            { id: "future-1", namespace, tenant, scheduledFor: futureDate(60_000) }
        ]);
        await vi.waitFor(() => expect(runAction).toHaveBeenCalledTimes(1));

        await svc.stop();
        finishFirst();
        await recovering;

        expect(runAction).toHaveBeenCalledTimes(1);
        expect(await svc.exists({ id: "future-1", namespace, tenant })).toBe(false);
    });

    it("arms no timer for an action scheduled after stop", async () => {
        const svc = createService();
        await svc.start();
        await svc.stop();

        await svc.create({ id: "late-1", namespace, tenant, scheduleFor: futureDate(60_000) });

        expect(await svc.exists({ id: "late-1", namespace, tenant })).toBe(false);
    });
});
