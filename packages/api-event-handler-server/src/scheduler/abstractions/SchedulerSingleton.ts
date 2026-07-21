import { createAbstraction } from "@webiny/feature/api";
import type { BreeSchedulerService } from "@webiny/api-scheduler-server";

/**
 * DI token for the single root Bree scheduler instance. Distinct from the `SchedulerService`
 * abstraction (create/update/delete/exists): this exposes the concrete service so the recover route +
 * boot step can call `recover()`, which isn't part of the SchedulerService contract.
 */
export const SchedulerSingleton = createAbstraction<BreeSchedulerService>(
    "SchedulerServer/Singleton"
);

export namespace SchedulerSingleton {
    export type Interface = BreeSchedulerService;
}
