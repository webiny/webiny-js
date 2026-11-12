import { WebinyError } from "@webiny/error";
import {
    type ISchedulerServiceCreateParams,
    type ISchedulerServiceUpdateParams,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { ConcurrencySlots } from "@webiny/utils/ConcurrencySlots.js";

/*
 * The longest delay `setTimeout` takes (2^31 - 1 ms, about 24.8 days). A longer one fires at once, so
 * an action due later than this gets a timer for this long and is re-armed when it fires.
 */
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

/*
 * How many actions this process runs at the same time. Each one runs in a request container of its
 * own and talks to the database, so hundreds due at the same moment are run this many at a time
 * rather than all at once.
 */
const DEFAULT_MAX_CONCURRENT_ACTIONS = 10;

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
    timer: ReturnType<typeof setTimeout>;
}

export interface ITimerSchedulerServiceParams {
    logger: Logger.Interface;
    runAction: (id: string, namespace: string, tenant: string) => Promise<void>;
    maxConcurrentActions?: number;
}

/**
 * One in-process timer per scheduled action, the standalone counterpart of an EventBridge schedule.
 * This is a long-lived root SINGLETON (started once at boot): it holds this process's live timers for
 * ALL tenants, so each job records its own tenant and `runAction` is called with it (the action runs
 * outside any request, so the tenant can't be read from a request context).
 *
 * With several processes, each holds its own timers for the same actions: `recover` runs again on a
 * timer to arm what this process has not seen, and whoever supplies `runAction` makes sure an action
 * runs once.
 */
export class TimerSchedulerService implements SchedulerService.Interface {
    private readonly jobs = new Map<string, IScheduledJob>();
    private readonly logger;
    private readonly runAction;
    private readonly maxConcurrentActions;
    // Triggers started and not finished yet, so a shutdown can wait for them.
    private readonly running = new Set<Promise<void>>();
    // Triggers take one of these before they run; the rest wait in line. Closed by `stop`.
    private readonly slots: ConcurrencySlots;
    /*
     * Set by `stop`. A recovery that started before the stop runs overdue actions one by one and can
     * still be going after it; this keeps it from starting more actions or arming timers. Actions it
     * skips stay stored and are picked up by another process's recovery.
     */
    private stopped = false;

    public constructor(params: ITimerSchedulerServiceParams) {
        this.logger = params.logger;
        this.runAction = params.runAction;
        this.maxConcurrentActions = params.maxConcurrentActions ?? DEFAULT_MAX_CONCURRENT_ACTIONS;
        this.slots = new ConcurrencySlots(this.maxConcurrentActions);
    }

    public async start(): Promise<void> {
        this.stopped = false;
        // Actions still running from before a `stop` keep their slots, so they count against the limit.
        this.slots.open();
    }

    /**
     * Clears every timer and keeps waiting triggers from starting. Triggers already running are not
     * interrupted; `waitForRunning` waits for them.
     */
    public async stop(): Promise<void> {
        this.stopped = true;
        for (const job of this.jobs.values()) {
            clearTimeout(job.timer);
        }
        this.jobs.clear();
        this.slots.close();
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

        this.arm(id, namespace, tenant, scheduleFor);
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

        this.disarm(id);
        await this.create(params);
    }

    public async delete(params: SchedulerService.DeleteParams): Promise<void> {
        const { id } = params;
        const exists = await this.exists(params);
        if (!exists) {
            throw new WebinyError(`Cannot delete schedule "${id}" because it does not exist.`);
        }

        this.disarm(id);
    }

    public async exists(params: SchedulerService.ExistsParams): Promise<boolean> {
        const { id } = params;
        return this.jobs.has(id);
    }

    /**
     * (Re)arm timers for a batch of persisted pending actions. Runs at boot (per tenant) to restore
     * schedules after a restart, and then on a timer, so this process also arms actions another
     * process scheduled or moved. Overdue actions run one by one, before the next action is looked at.
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
                await this.trigger(action.id, action.namespace, action.tenant);
                continue;
            }

            const armed = this.jobs.get(action.id);
            if (armed && armed.scheduledFor.getTime() === action.scheduledFor.getTime()) {
                continue;
            }

            this.disarm(action.id);
            this.arm(action.id, action.namespace, action.tenant, action.scheduledFor);
        }
    }

    private arm(id: string, namespace: string, tenant: string, scheduledFor: Date): void {
        if (this.stopped) {
            return;
        }

        const untilDue = scheduledFor.getTime() - Date.now();
        const capped = Math.min(untilDue, MAX_TIMER_DELAY_MS);
        const delay = Math.max(capped, 0);
        const timer = setTimeout(() => {
            if (this.jobs.get(id)?.timer !== timer) {
                return;
            }
            this.jobs.delete(id);
            if (scheduledFor.getTime() > Date.now()) {
                this.arm(id, namespace, tenant, scheduledFor);
                return;
            }
            void this.trigger(id, namespace, tenant);
        }, delay);
        // An armed action alone should not keep the process running.
        timer.unref();

        this.jobs.set(id, { namespace, tenant, scheduledFor, timer });
    }

    private disarm(id: string): void {
        const job = this.jobs.get(id);
        if (!job) {
            return;
        }
        clearTimeout(job.timer);
        this.jobs.delete(id);
    }

    private async trigger(id: string, namespace: string, tenant: string): Promise<void> {
        const granted = await this.slots.acquire();
        if (!granted) {
            return;
        }
        // Granted just before a `stop`, which only turns away those still waiting.
        if (this.stopped) {
            this.slots.release();
            return;
        }
        const triggered = this.runAction(id, namespace, tenant);
        this.running.add(triggered);
        try {
            await triggered;
        } catch (error) {
            this.logger.error({ error, id, tenant }, "[scheduler] scheduled action failed");
        } finally {
            this.running.delete(triggered);
            this.slots.release();
        }
    }
}
