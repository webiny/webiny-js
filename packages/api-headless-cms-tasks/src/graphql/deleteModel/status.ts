import { DeleteCmsModelTaskStatus } from "~/features/DeleteModelTask/types.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";

export const getStatus = (status: TaskDataStatus): DeleteCmsModelTaskStatus => {
    switch (status) {
        case TaskDataStatus.PENDING:
        case TaskDataStatus.RUNNING:
            return DeleteCmsModelTaskStatus.RUNNING;
        case TaskDataStatus.FAILED:
            return DeleteCmsModelTaskStatus.ERROR;
        case TaskDataStatus.ABORTED:
            return DeleteCmsModelTaskStatus.CANCELED;
        case TaskDataStatus.SUCCESS:
            return DeleteCmsModelTaskStatus.DONE;
    }
};
