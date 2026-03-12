import { ScheduleType } from "~/types.js";
import type {
    ICancelScheduleActionGateway,
    ISchedulePublishActionGateway,
    IScheduleUnpublishActionGateway
} from "~/Gateways/index.js";
import type {
    IScheduleDialogAction,
    IScheduleDialogCancelActionExecuteParams,
    IScheduleDialogScheduleActionExecuteParams
} from "./types.js";

export interface IScheduleDialogActionParams {
    cancelGateway: ICancelScheduleActionGateway;
    publishGateway: ISchedulePublishActionGateway;
    unpublishGateway: IScheduleUnpublishActionGateway;
}

export class ScheduleDialogAction implements IScheduleDialogAction {
    public readonly cancelGateway: ICancelScheduleActionGateway;
    public readonly publishGateway: ISchedulePublishActionGateway;
    public readonly unpublishGateway: IScheduleUnpublishActionGateway;

    public constructor(params: IScheduleDialogActionParams) {
        const { publishGateway, unpublishGateway, cancelGateway } = params;

        this.cancelGateway = cancelGateway;
        this.publishGateway = publishGateway;
        this.unpublishGateway = unpublishGateway;
    }

    public async schedule(params: IScheduleDialogScheduleActionExecuteParams): Promise<void> {
        const { id, namespace, type, scheduleOn } = params;

        switch (type) {
            case ScheduleType.publish:
                await this.publishGateway.execute({
                    namespace,
                    id,
                    scheduleOn
                });
                return;
            case ScheduleType.unpublish:
                await this.unpublishGateway.execute({
                    namespace,
                    id,
                    scheduleOn
                });
                return;
            default:
                throw new Error(
                    `Unsupported schedule type "${type}" for entry "${id}" and namespace "${namespace}".`
                );
        }
    }

    public async cancel(params: IScheduleDialogCancelActionExecuteParams): Promise<void> {
        const { id, namespace } = params;
        await this.cancelGateway.execute({
            namespace,
            id
        });
    }
}
