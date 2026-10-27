import Bree from "bree";
import { fileURLToPath } from "node:url";
import { WebinyError } from "@webiny/error";
import {
    type ISchedulerServiceCreateParams,
    type ISchedulerServiceUpdateParams,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";

// bree loads this file at runtime via `new Worker(path)`. Referencing it through `new URL` (rather
// than path.join) makes the app bundler emit pollWorker into build/ as an asset, resolved relative
// to this module (the server build sets assetPrefix "auto"); fileURLToPath then hands bree a plain
// path string. Un-bundled (dev), import.meta.url is real and it resolves to the dist/jobs file.
const workerPath = fileURLToPath(new URL("./jobs/pollWorker.js", import.meta.url));

export interface IPendingAction {
    id: string;
    namespace: string;
    tenant: string;
    scheduledFor: Date;
}

interface IScheduledJob {
    namespace: string;
    tenant: string;
    scheduledFor: Date;
}

export interface IBreeSchedulerServiceParams {
    logger: Logger.Interface;
    runAction: (id: string, namespace: string, tenant: string) => Promise<void>;
}

/**
 * One-shot bree job per scheduled action — mirrors EventBridge behaviour. This is a long-lived root
 * SINGLETON (started once at boot): it holds this process's live timers for ALL tenants, so each job
 * records its own tenant and `runAction` is called with it (the action runs outside any request, so
 * the tenant can't be read from a request context).
 *
 * With several processes, each holds its own timers for the same actions: `recover` runs again on a
 * timer to arm what this process has not seen, and whoever supplies `runAction` makes sure an action
 * runs once.
 */
export class BreeSchedulerService implements SchedulerService.Interface {
    private readonly bree;
    private readonly jobs = new Map<string, IScheduledJob>();
    private readonly logger;
    private readonly runAction;
    // Triggers started and not finished yet, so a shutdown can wait for them.
    private readonly running = new Set<Promise<void>>();
    /*
     * Set by `stop`. A recovery that started before the stop runs overdue actions one by one and can
     * still be going after it; this keeps it from starting more actions or arming timers on a Bree
     * that is stopped. Actions it skips stay stored and are picked up by another process's recovery.
     */
    private stopped = false;

    public constructor(params: IBreeSchedulerServiceParams) {
        this.logger = params.logger;
        this.runAction = params.runAction;

        this.bree = new Bree({
            root: false,
            jobs: [],
            logger: false,
            workerMessageHandler: async ({ name }) => {
                const job = this.jobs.get(name);
                if (!job) {
                    return;
                }

                this.jobs.delete(name);
                await this.trigger(name, job.namespace, job.tenant);
            }
        });
    }

    public async start(): Promise<void> {
        this.stopped = false;
        await this.bree.start();
    }

    public async stop(): Promise<void> {
        this.stopped = true;
        await this.bree.stop();
    }

    /**
     * Resolves once every trigger already started has finished, or after `timeoutMs`. Call it after
     * `stop`, which keeps new ones from starting.
     */
    public async waitForRunning(timeoutMs: number): Promise<void> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<void>(resolve => {
            timer = setTimeout(resolve, timeoutMs);
        });
        const running = Promise.allSettled([...this.running]);
        await Promise.race([running, timeout]);
        clearTimeout(timer);
    }

    public async create(params: ISchedulerServiceCreateParams): Promise<void> {
        const { id, namespace, scheduleFor, tenant } = params;

        if (scheduleFor <= new Date()) {
            throw new WebinyError(
                `Cannot create a schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                { scheduleFor, id }
            );
        }

        const exists = await this.exists({
            id,
            namespace,
            tenant
        });
        if (exists) {
            return this.update(params);
        }

        await this.arm(id, { namespace, tenant, scheduledFor: scheduleFor });
    }

    public async update(params: ISchedulerServiceUpdateParams): Promise<void> {
        const { id, scheduleFor } = params;

        if (scheduleFor <= new Date()) {
            throw new WebinyError(
                `Cannot update an existing schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                { scheduleFor, id }
            );
        }

        await this.safeRemove(id);
        await this.create(params);
    }

    public async delete(params: SchedulerService.DeleteParams): Promise<void> {
        const { id } = params;
        const exists = await this.exists(params);
        if (!exists) {
            throw new WebinyError(`Cannot delete schedule "${id}" because it does not exist.`);
        }

        await this.safeRemove(id);
    }

    public async exists(params: SchedulerService.ExistsParams): Promise<boolean> {
        const { id } = params;
        return this.jobs.has(id);
    }

    /**
     * (Re)arm timers for a batch of persisted pending actions. Runs at boot (per tenant) to restore
     * schedules after a restart, and then on a timer, so this process also arms actions another
     * process scheduled or moved. Overdue actions fire immediately.
     *
     * An action already armed for the same time is left as it is; one armed for a different time was
     * moved by another process and is re-armed.
     */
    public async recover(pendingActions: IPendingAction[]): Promise<void> {
        const now = new Date();

        for (const action of pendingActions) {
            if (this.stopped) {
                return;
            }
            if (action.scheduledFor <= now) {
                /* Overdue — execute immediately. */
                await this.trigger(action.id, action.namespace, action.tenant);
                continue;
            }

            const armed = this.jobs.get(action.id);
            if (armed && armed.scheduledFor.getTime() === action.scheduledFor.getTime()) {
                continue;
            }
            if (armed) {
                await this.safeRemove(action.id);
            }

            await this.arm(action.id, {
                namespace: action.namespace,
                tenant: action.tenant,
                scheduledFor: action.scheduledFor
            });
        }
    }

    private async arm(id: string, job: IScheduledJob): Promise<void> {
        if (this.stopped) {
            return;
        }
        this.jobs.set(id, job);

        await this.bree.add({
            name: id,
            date: job.scheduledFor,
            path: workerPath
        });

        await this.bree.start(id);
    }

    private async trigger(id: string, namespace: string, tenant: string): Promise<void> {
        if (this.stopped) {
            return;
        }
        const triggered = this.runAction(id, namespace, tenant);
        this.running.add(triggered);
        try {
            await triggered;
        } finally {
            this.running.delete(triggered);
        }
    }

    private async safeRemove(id: string): Promise<void> {
        this.jobs.delete(id);

        try {
            await this.bree.stop(id);
        } catch {
            this.logger.debug(`Could not stop bree job "${id}" — it may have already fired.`);
        }

        try {
            await this.bree.remove(id);
        } catch {
            this.logger.debug(
                `Could not remove bree job "${id}" — it may have already been removed.`
            );
        }
    }
}
