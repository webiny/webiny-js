import { WebinyError } from "@webiny/error";
import {
    type ISchedulerServiceCreateParams,
    type ISchedulerServiceUpdateParams,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";

export interface ITimerSchedulerServiceParams {
    onTrigger: (id: string, namespace: string) => Promise<void>;
}

/* In-process timer-based scheduler for non-AWS (server) deployments. */
export class TimerSchedulerService implements SchedulerService.Interface {
    private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
    private readonly onTrigger: ITimerSchedulerServiceParams["onTrigger"];

    public constructor(params: ITimerSchedulerServiceParams) {
        this.onTrigger = params.onTrigger;
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

        if (this.timers.has(id)) {
            return this.update(params);
        }

        const delay = scheduleFor.getTime() - Date.now();
        const timer = setTimeout(async () => {
            this.timers.delete(id);
            try {
                await this.onTrigger(id, namespace);
            } catch (err) {
                console.error(`Scheduled action "${id}" failed:`, err);
            }
        }, delay);

        this.timers.set(id, timer);
    }

    public async update(params: ISchedulerServiceUpdateParams): Promise<void> {
        const { id } = params;

        if (scheduleIsInPast(params.scheduleFor)) {
            throw new WebinyError(
                `Cannot update an existing schedule for "${id}" with date in the past`,
                "INVALID_SCHEDULE_DATE",
                { scheduleFor: params.scheduleFor, id }
            );
        }

        this.clearTimer(id);
        await this.create(params);
    }

    public async delete(id: string): Promise<void> {
        if (!this.timers.has(id)) {
            throw new WebinyError(`Cannot delete schedule "${id}" because it does not exist.`);
        }
        this.clearTimer(id);
    }

    public async exists(id: string): Promise<boolean> {
        return this.timers.has(id);
    }

    public destroy(): void {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
    }

    private clearTimer(id: string): void {
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
    }
}

const scheduleIsInPast = (date: Date): boolean => {
    return date <= new Date();
};
