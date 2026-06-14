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

export interface IBreeSchedulerServiceParams {
    logger: Logger.Interface;
    onTrigger: (id: string, namespace: string) => Promise<void>;
}

/* One-shot bree job per scheduled action — mirrors EventBridge behavior. */
export class BreeSchedulerService implements SchedulerService.Interface {
    private readonly bree;
    private readonly namespaces = new Map<string, string>();
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
                const namespace = this.namespaces.get(name);
                if (!namespace) {
                    return;
                }

                this.namespaces.delete(name);
                await this.onTrigger(name, namespace);
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
        const { id, namespace, scheduleFor } = params;

        if (scheduleFor <= new Date()) {
            throw new WebinyError(
                `Cannot create a schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                { scheduleFor, id }
            );
        }

        const exists = await this.exists(id);
        if (exists) {
            return this.update(params);
        }

        this.namespaces.set(id, namespace);

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

    public async delete(id: string): Promise<void> {
        const exists = await this.exists(id);
        if (!exists) {
            throw new WebinyError(`Cannot delete schedule "${id}" because it does not exist.`);
        }

        await this.safeRemove(id);
    }

    public async exists(id: string): Promise<boolean> {
        return this.namespaces.has(id);
    }

    /* Re-register pending actions from DB after a restart. */
    public async recover(
        pendingActions: Array<{ id: string; namespace: string; scheduledFor: Date }>
    ): Promise<void> {
        const now = new Date();

        for (const action of pendingActions) {
            if (action.scheduledFor <= now) {
                /* Overdue — execute immediately. */
                await this.onTrigger(action.id, action.namespace);
                continue;
            }

            this.namespaces.set(action.id, action.namespace);

            await this.bree.add({
                name: action.id,
                date: action.scheduledFor,
                path: workerPath
            });

            await this.bree.start(action.id);
        }
    }

    private async safeRemove(id: string): Promise<void> {
        this.namespaces.delete(id);

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
