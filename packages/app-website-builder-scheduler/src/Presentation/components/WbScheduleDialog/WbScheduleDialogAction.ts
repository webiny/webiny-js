import { ScheduleType } from "~/types.js";
import type {
    IWbSchedulerCancelGateway,
    IWbSchedulerPublishGateway,
    IWbSchedulerUnpublishGateway
} from "~/Gateways/index.js";
import type {
    IWbScheduleDialogAction,
    IWbScheduleDialogCancelActionExecuteParams,
    IWbScheduleDialogScheduleActionExecuteParams
} from "./types.js";

const PAGE_MODEL_ID = "page";

export interface IWbScheduleDialogActionParams {
    cancelGateway: IWbSchedulerCancelGateway;
    publishGateway: IWbSchedulerPublishGateway;
    unpublishGateway: IWbSchedulerUnpublishGateway;
}

export class WbScheduleDialogAction implements IWbScheduleDialogAction {
    public readonly cancelGateway: IWbSchedulerCancelGateway;
    public readonly publishGateway: IWbSchedulerPublishGateway;
    public readonly unpublishGateway: IWbSchedulerUnpublishGateway;

    public constructor(params: IWbScheduleDialogActionParams) {
        const { publishGateway, unpublishGateway, cancelGateway } = params;

        this.cancelGateway = cancelGateway;
        this.publishGateway = publishGateway;
        this.unpublishGateway = unpublishGateway;
    }

    public async schedule(params: IWbScheduleDialogScheduleActionExecuteParams): Promise<void> {
        const { id, type, scheduleOn } = params;

        switch (type) {
            case ScheduleType.publish:
                await this.publishGateway.execute({
                    modelId: PAGE_MODEL_ID,
                    id,
                    scheduleOn
                });
                return;
            case ScheduleType.unpublish:
                await this.unpublishGateway.execute({
                    modelId: PAGE_MODEL_ID,
                    id,
                    scheduleOn
                });
                return;
            default:
                throw new Error(`Unsupported schedule type "${type}" for entry "${id}".`);
        }
    }

    public async cancel(params: IWbScheduleDialogCancelActionExecuteParams): Promise<void> {
        const { id } = params;
        await this.cancelGateway.execute({ modelId: PAGE_MODEL_ID, id });
    }
}
