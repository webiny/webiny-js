import {
    type ISchedulerServiceCreateParams,
    type ISchedulerServiceUpdateParams,
    SchedulerService
} from "~/shared/abstractions.js";

export interface IVoidSchedulerServiceParams {
    create?: (params: ISchedulerServiceCreateParams) => Promise<void>;
    update?: (params: ISchedulerServiceUpdateParams) => Promise<void>;
    delete?: (id: string) => Promise<void>;
    exists?: (id: string) => Promise<boolean>;
}

export class VoidSchedulerService implements SchedulerService.Interface {
    private readonly callbacks: IVoidSchedulerServiceParams | undefined;

    public constructor(callbacks?: IVoidSchedulerServiceParams) {
        this.callbacks = callbacks;
    }

    public async create(params: ISchedulerServiceCreateParams): Promise<void> {
        if (!this.callbacks?.create) {
            return;
        }
        return this.callbacks?.create(params);
    }

    public async update(params: ISchedulerServiceUpdateParams): Promise<void> {
        if (!this.callbacks?.update) {
            return;
        }
        return this.callbacks?.update(params);
    }

    public async delete(id: string): Promise<void> {
        if (!this.callbacks?.delete) {
            return;
        }
        return this.callbacks?.delete(id);
    }

    public async exists(id: string): Promise<boolean> {
        if (!this.callbacks?.exists) {
            return false;
        }
        return this.callbacks?.exists(id);
    }
}
