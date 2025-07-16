export interface ISchedulerServiceCreateInput {
    id: string;
    dateOn: Date;
}

export interface ISchedulerServiceUpdateInput {
    id: string;
    dateOn: Date;
}

export interface ISchedulerService {
    create(params: ISchedulerServiceCreateInput): Promise<void>;
    update(params: ISchedulerServiceUpdateInput): Promise<void>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
}
