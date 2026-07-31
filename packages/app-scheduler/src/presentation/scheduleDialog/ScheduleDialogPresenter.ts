import { makeAutoObservable, runInAction } from "mobx";
import { GetScheduledActionGateway } from "~/features/getScheduledAction/abstractions.js";
import { CancelScheduledActionGateway } from "~/features/cancelScheduledAction/abstractions.js";
import { SchedulePublishActionGateway } from "~/features/schedulePublishAction/abstractions.js";
import { ScheduleUnpublishActionGateway } from "~/features/scheduleUnpublishAction/abstractions.js";
import { ScheduleActionType } from "~/types.js";
import type { SchedulerEntry } from "~/types.js";
import {
    ScheduleDialogPresenter as Abstraction,
    type IScheduleDialogPresenter,
    type IScheduleDialogPresenterViewModel,
    type IScheduleDialogPresenterLoadParams,
    type IScheduleDialogPresenterScheduleParams,
    type IScheduleDialogPresenterCancelParams
} from "./abstractions.js";

class ScheduleDialogPresenterImpl implements IScheduleDialogPresenter {
    private loading = false;
    private entry: SchedulerEntry | null = null;

    constructor(
        private readonly getGateway: GetScheduledActionGateway.Interface,
        private readonly cancelGateway: CancelScheduledActionGateway.Interface,
        private readonly publishGateway: SchedulePublishActionGateway.Interface,
        private readonly unpublishGateway: ScheduleUnpublishActionGateway.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm(): IScheduleDialogPresenterViewModel {
        return {
            loading: this.loading,
            entry: this.entry
        };
    }

    async load(params: IScheduleDialogPresenterLoadParams): Promise<void> {
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

    async schedule(params: IScheduleDialogPresenterScheduleParams): Promise<void> {
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

    async cancel(params: IScheduleDialogPresenterCancelParams): Promise<void> {
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

    reset(): void {
        this.entry = null;
        this.loading = false;
    }
}

export const ScheduleDialogPresenter = Abstraction.createImplementation({
    implementation: ScheduleDialogPresenterImpl,
    dependencies: [
        GetScheduledActionGateway,
        CancelScheduledActionGateway,
        SchedulePublishActionGateway,
        ScheduleUnpublishActionGateway
    ]
});
