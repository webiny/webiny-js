import type { SchedulerService } from "~/shared/abstractions.js";

export interface IVoidSchedulerServiceParams {
    create?: (params: SchedulerService.CreateParams) => Promise<void>;
    update?: (params: SchedulerService.UpdateParams) => Promise<void>;
    delete?: (params: SchedulerService.DeleteParams) => Promise<void>;
    exists?: (params: SchedulerService.ExistsParams) => Promise<boolean>;
}

export class VoidSchedulerService implements SchedulerService.Interface {
    private readonly callbacks: IVoidSchedulerServiceParams | undefined;

    public constructor(callbacks?: IVoidSchedulerServiceParams) {
        this.callbacks = callbacks;
    }

    public async create(params: SchedulerService.CreateParams): Promise<void> {
        if (!this.callbacks?.create) {
            return;
        }
        return this.callbacks?.create(params);
    }

    public async update(params: SchedulerService.UpdateParams): Promise<void> {
        if (!this.callbacks?.update) {
            return;
        }
        return this.callbacks?.update(params);
    }

    public async delete(params: SchedulerService.DeleteParams): Promise<void> {
        if (!this.callbacks?.delete) {
            return;
        }
        return this.callbacks.delete(params);
    }

    public async exists(params: SchedulerService.ExistsParams): Promise<boolean> {
        if (!this.callbacks?.exists) {
            return false;
        }
        return this.callbacks.exists(params);
    }
}
