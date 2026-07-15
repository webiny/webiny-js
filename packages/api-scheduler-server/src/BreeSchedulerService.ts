import Bree from "bree";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebinyError } from "@webiny/error";
import {
    type ISchedulerServiceCreateParams,
    type ISchedulerServiceUpdateParams,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";

const jobsDir = join(dirname(fileURLToPath(import.meta.url)), "jobs");
const workerPath = join(jobsDir, "pollWorker.js");

export interface IPendingAction {
    id: string;
    namespace: string;
    tenant: string;
    scheduledFor: Date;
}

interface IScheduledJob {
    namespace: string;
    tenant: string;
}

export interface IBreeSchedulerServiceParams {
    logger: Logger.Interface;
    onTrigger: (id: string, namespace: string, tenant: string) => Promise<void>;
}

/**
 * One-shot bree job per scheduled action — mirrors EventBridge behaviour. This is a single-process,
 * long-lived root SINGLETON (started once at boot): it holds the live timers for ALL tenants, so each
 * job records its own tenant and `onTrigger` is fired with it (the trigger runs outside any request,
 * so the tenant can't be read from a request context).
 */
export class BreeSchedulerService implements SchedulerService.Interface {
    private readonly bree;
    private readonly jobs = new Map<string, IScheduledJob>();
    private readonly logger;
    private readonly onTrigger;

    public constructor(params: IBreeSchedulerServiceParams) {
        this.logger = params.logger;
        this.onTrigger = params.onTrigger;

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
                await this.onTrigger(name, job.namespace, job.tenant);
            }
        });
    }

    public async start(): Promise<void> {
        await this.bree.start();
    }

    public async stop(): Promise<void> {
        await this.bree.stop();
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

        this.jobs.set(id, { namespace, tenant });

        await this.bree.add({
            name: id,
            date: scheduleFor,
            path: workerPath
        });

        await this.bree.start(id);
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
     * (Re)arm timers for a batch of persisted pending actions — called at boot (per tenant) to restore
     * schedules after a restart. Overdue actions fire immediately.
     */
    public async recover(pendingActions: IPendingAction[]): Promise<void> {
        const now = new Date();

        for (const action of pendingActions) {
            if (action.scheduledFor <= now) {
                /* Overdue — execute immediately. */
                await this.onTrigger(action.id, action.namespace, action.tenant);
                continue;
            }

            this.jobs.set(action.id, { namespace: action.namespace, tenant: action.tenant });

            await this.bree.add({
                name: action.id,
                date: action.scheduledFor,
                path: workerPath
            });

            await this.bree.start(action.id);
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
