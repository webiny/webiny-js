import { makeAutoObservable, runInAction } from "mobx";
import { ScheduleActionType } from "~/types.js";
import type { SchedulerEntry } from "~/types.js";
import type {
    ICancelScheduledActionGateway,
    IGetScheduledActionGateway,
    ISchedulePublishActionGateway,
    IScheduleUnpublishActionGateway
} from "~/Gateways/index.js";
import type {
    IScheduleDialogPresenter,
    IScheduleDialogPresenterCancelParams,
    IScheduleDialogPresenterLoadParams,
    IScheduleDialogPresenterScheduleParams,
    IScheduleDialogPresenterViewModel
} from "./IScheduleDialogPresenter.js";

export interface IScheduleDialogPresenterParams {
    getGateway: IGetScheduledActionGateway;
    cancelGateway: ICancelScheduledActionGateway;
    publishGateway: ISchedulePublishActionGateway;
    unpublishGateway: IScheduleUnpublishActionGateway;
}

export class ScheduleDialogPresenter implements IScheduleDialogPresenter {
    private loading = false;
    private entry: SchedulerEntry | null = null;

    private readonly getGateway: IGetScheduledActionGateway;
    private readonly cancelGateway: ICancelScheduledActionGateway;
    private readonly publishGateway: ISchedulePublishActionGateway;
    private readonly unpublishGateway: IScheduleUnpublishActionGateway;

    public constructor(params: IScheduleDialogPresenterParams) {
        this.getGateway = params.getGateway;
        this.cancelGateway = params.cancelGateway;
        this.publishGateway = params.publishGateway;
        this.unpublishGateway = params.unpublishGateway;
        makeAutoObservable(this);
    }

    public get vm(): IScheduleDialogPresenterViewModel {
        return {
            loading: this.loading,
            entry: this.entry
        };
    }

    public async load(params: IScheduleDialogPresenterLoadParams): Promise<void> {
        this.loading = true;

        try {
            const entry = await this.getGateway.execute(params);
            runInAction(() => {
                this.entry = entry;
                this.loading = false;
            });
        } catch {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    public async schedule(params: IScheduleDialogPresenterScheduleParams): Promise<void> {
        const { targetId, namespace, scheduleOn, actionType } = params;
        this.loading = true;

        try {
            switch (actionType) {
                case ScheduleActionType.publish:
                    await this.publishGateway.execute({ namespace, targetId, scheduleOn });
                    break;
                case ScheduleActionType.unpublish:
                    await this.unpublishGateway.execute({ namespace, targetId, scheduleOn });
                    break;
                default:
                    throw new Error(`Unsupported action type "${actionType}".`);
            }
            runInAction(() => {
                this.entry = null;
                this.loading = false;
            });
        } catch {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    public async cancel(params: IScheduleDialogPresenterCancelParams): Promise<void> {
        this.loading = true;

        try {
            await this.cancelGateway.execute(params);
            runInAction(() => {
                this.entry = null;
                this.loading = false;
            });
        } catch {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    public reset(): void {
        this.entry = null;
        this.loading = false;
    }
}
