import { SchedulerService } from "~/shared/abstractions.js";

export class VoidSchedulerService implements SchedulerService.Interface {
    async create(): Promise<void> {
        // Do nothing.
    }

    async update(): Promise<void> {
        // Do nothing.
    }

    async delete(): Promise<void> {
        // Do nothing.
    }

    async exists(): Promise<boolean> {
        return false;
    }
}
