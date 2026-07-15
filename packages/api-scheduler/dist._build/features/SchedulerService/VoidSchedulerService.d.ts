import type { SchedulerService } from "~/shared/abstractions.js";
export interface IVoidSchedulerServiceParams {
    create?: (params: SchedulerService.CreateParams) => Promise<void>;
    update?: (params: SchedulerService.UpdateParams) => Promise<void>;
    delete?: (params: SchedulerService.DeleteParams) => Promise<void>;
    exists?: (params: SchedulerService.ExistsParams) => Promise<boolean>;
}
export declare class VoidSchedulerService implements SchedulerService.Interface {
    private readonly callbacks;
    constructor(callbacks?: IVoidSchedulerServiceParams);
    create(params: SchedulerService.CreateParams): Promise<void>;
    update(params: SchedulerService.UpdateParams): Promise<void>;
    delete(params: SchedulerService.DeleteParams): Promise<void>;
    exists(params: SchedulerService.ExistsParams): Promise<boolean>;
}
