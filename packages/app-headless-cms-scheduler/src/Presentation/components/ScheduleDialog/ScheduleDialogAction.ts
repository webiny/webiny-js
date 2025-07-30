import { ScheduleType } from "~/types.js";
import type {
    ISchedulerCancelGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways/index.js";
import type {
    IScheduleDialogAction,
    IScheduleDialogCancelActionExecuteParams,
    IScheduleDialogScheduleActionExecuteParams
} from "./types.js";

export interface IScheduleDialogActionParams {
    cancelGateway: ISchedulerCancelGateway;
    publishGateway: ISchedulerPublishGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
}

export class ScheduleDialogAction implements IScheduleDialogAction {
    public readonly cancelGateway: ISchedulerCancelGateway;
    public readonly publishGateway: ISchedulerPublishGateway;
    public readonly unpublishGateway: ISchedulerUnpublishGateway;

    public constructor(params: IScheduleDialogActionParams) {
        const { publishGateway, unpublishGateway, cancelGateway } = params;

        this.cancelGateway = cancelGateway;
        this.publishGateway = publishGateway;
        this.unpublishGateway = unpublishGateway;
    }

    public async schedule(params: IScheduleDialogScheduleActionExecuteParams): Promise<void> {
        const { id, modelId, type, scheduleOn } = params;

        switch (type) {
            case ScheduleType.publish:
                await this.publishGateway.execute({
                    modelId,
                    id,
                    scheduleOn
                });
                return;
            case ScheduleType.unpublish:
                await this.unpublishGateway.execute({
                    modelId,
                    id,
                    scheduleOn
                });
                return;
            default:
                throw new Error(
                    `Unsupported schedule type "${type}" for entry "${id}" and model "${modelId}".`
                );
        }
    }

    public async cancel(params: IScheduleDialogCancelActionExecuteParams): Promise<void> {
        const { id, modelId } = params;
        await this.cancelGateway.execute({
            modelId,
            id
        });
    }
}
