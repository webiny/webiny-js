import type {
    ISchedulerServiceCreateParams,
    ISchedulerServiceUpdateParams,
    SchedulerService
} from "@webiny/api-scheduler";

export interface NodeScheduledFireEvent {
    id: string;
    namespace: string;
    scheduledFor: Date;
    /** Wall-clock time the timer actually fired. */
    firedAt: Date;
}

export interface NodeSchedulerServiceParams {
    /**
     * Invoked when a scheduled action's timer fires. The container API entry
     * supplies the function that dispatches the scheduled-action event into
     * the rest of the runtime; if omitted, the timer fires log a single line
     * to stdout (useful for early dev / smoke tests).
     */
    onFire?: (event: NodeScheduledFireEvent) => void | Promise<void>;
}

interface ScheduledEntry {
    namespace: string;
    scheduledFor: Date;
    timer: NodeJS.Timeout;
}

const MAX_TIMEOUT_MS = 2_147_483_647; // Node's setTimeout cap (~24.85 days)

/**
 * In-process scheduler service.
 *
 * The `SchedulerService` interface only takes a single `scheduleFor: Date`
 * (one-shot, not recurring), so a plain `setTimeout` is sufficient — no
 * `node-cron` dependency. State lives in a Map; if the container restarts,
 * pending schedules are lost. This is acceptable for the POC; persistent
 * scheduling (survive restarts) would store the schedule in SQLite and
 * re-arm timers on boot.
 *
 * Scheduling far-future actions is supported by re-arming the timer when
 * the current segment expires — Node's setTimeout caps at ~24.85 days.
 */
export class NodeSchedulerService implements SchedulerService.Interface {
    private readonly schedules = new Map<string, ScheduledEntry>();
    private readonly onFire?: NodeSchedulerServiceParams["onFire"];

    public constructor(params: NodeSchedulerServiceParams = {}) {
        this.onFire = params.onFire;
    }

    public async create(params: ISchedulerServiceCreateParams): Promise<void> {
        this.cancel(params.id);
        this.arm(params.id, params.namespace, params.scheduleFor);
    }

    public async update(params: ISchedulerServiceUpdateParams): Promise<void> {
        this.cancel(params.id);
        this.arm(params.id, params.namespace, params.scheduleFor);
    }

    public async delete(id: string): Promise<void> {
        this.cancel(id);
    }

    public async exists(id: string): Promise<boolean> {
        return this.schedules.has(id);
    }

    /** Cancel + clear all in-memory schedules. Used in tests / shutdown. */
    public clear(): void {
        for (const id of this.schedules.keys()) {
            this.cancel(id);
        }
    }

    private cancel(id: string): void {
        const entry = this.schedules.get(id);
        if (!entry) {
            return;
        }
        clearTimeout(entry.timer);
        this.schedules.delete(id);
    }

    private arm(id: string, namespace: string, scheduledFor: Date): void {
        const remaining = scheduledFor.getTime() - Date.now();

        if (remaining <= 0) {
            // Scheduled in the past — fire on next tick rather than dropping.
            const timer = setImmediate(() => this.fire(id, namespace, scheduledFor));
            this.schedules.set(id, {
                namespace,
                scheduledFor,
                timer: timer as unknown as NodeJS.Timeout
            });
            return;
        }

        const delay = Math.min(remaining, MAX_TIMEOUT_MS);
        const timer = setTimeout(() => {
            // Re-arm if the original target is still in the future (we
            // walked one MAX_TIMEOUT_MS hop forward); otherwise fire.
            if (delay < remaining) {
                this.arm(id, namespace, scheduledFor);
            } else {
                this.fire(id, namespace, scheduledFor);
            }
        }, delay);

        this.schedules.set(id, { namespace, scheduledFor, timer });
    }

    private fire(id: string, namespace: string, scheduledFor: Date): void {
        this.schedules.delete(id);
        const event: NodeScheduledFireEvent = {
            id,
            namespace,
            scheduledFor,
            firedAt: new Date()
        };
        if (this.onFire) {
            Promise.resolve(this.onFire(event)).catch(err => {
                console.error(`NodeSchedulerService: onFire handler threw for id="${id}":`, err);
            });
        } else {
            console.log(
                `[NodeSchedulerService] fired id="${id}" namespace="${namespace}" scheduledFor=${scheduledFor.toISOString()} (no onFire handler — wire one up to dispatch into the runtime)`
            );
        }
    }
}
