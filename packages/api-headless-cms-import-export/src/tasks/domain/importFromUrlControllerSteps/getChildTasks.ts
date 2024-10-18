import type { ITask, ITaskResponseDoneResultOutput } from "@webiny/tasks";
import { TaskDataStatus } from "@webiny/tasks";
import type { Context } from "~/types";
import { IStepFunctionServiceFetchResult } from "@webiny/tasks/service/StepFunctionServicePlugin";

export interface IGetChildTasksParams {
    context: Context;
    task: ITask;
    definition: string;
}

const mapServiceStatusToTaskStatus = (
    task: ITask<any, any>,
    serviceInfo: IStepFunctionServiceFetchResult | null
) => {
    if (!serviceInfo) {
        console.log(`Service info is missing for task ${task.id} (${task.definitionId}).`);
        return null;
    }
    if (serviceInfo.status === "RUNNING") {
        return TaskDataStatus.RUNNING;
    } else if (serviceInfo.status === "SUCCEEDED") {
        return TaskDataStatus.SUCCESS;
    } else if (serviceInfo.status === "FAILED") {
        return TaskDataStatus.FAILED;
    } else if (serviceInfo.status === "ABORTED") {
        return TaskDataStatus.ABORTED;
    } else if (serviceInfo.status === "TIMED_OUT" || serviceInfo.status === "PENDING_REDRIVE") {
        console.log(
            `Service status is ${serviceInfo.status} for task ${task.id} (${task.definitionId}).`
        );
        return null;
    }
    return TaskDataStatus.PENDING;
};

export const getChildTasks = async <I, O extends ITaskResponseDoneResultOutput>({
    context,
    task,
    definition
}: IGetChildTasksParams) => {
    const running: string[] = [];
    const done: string[] = [];
    const invalid: string[] = [];
    const aborted: string[] = [];
    const failed: string[] = [];
    const collection: ITask<I, O>[] = [];

    const { items } = await context.tasks.listTasks<I, O>({
        where: {
            parentId: task.id,
            definitionId: definition
        },
        limit: 100000
    });
    for (const task of items) {
        collection.push(task);

        if (
            task.taskStatus === TaskDataStatus.RUNNING ||
            task.taskStatus === TaskDataStatus.PENDING
        ) {
            /**
             * We also need to check the actual status of the service.
             * It can happen that the task is marked as running, but the service is not running.
             */
            const serviceInfo = await context.tasks.fetchServiceInfo(task);
            const status = mapServiceStatusToTaskStatus(task, serviceInfo);

            if (status === null || !serviceInfo) {
                invalid.push(task.id);
                continue;
            } else if (status !== task.taskStatus) {
                console.error(
                    `Status of the task is not same as the status of the service (task: ${task.taskStatus}, service: ${status} / ${serviceInfo.status}).`
                );
                invalid.push(task.id);
                continue;
            }
            running.push(task.id);
            continue;
        } else if (task.taskStatus === TaskDataStatus.SUCCESS) {
            done.push(task.id);
            continue;
        } else if (task.taskStatus === TaskDataStatus.FAILED) {
            failed.push(task.id);
            continue;
        } else if (task.taskStatus === TaskDataStatus.ABORTED) {
            aborted.push(task.id);
            continue;
        }
        /**
         * Impossible to be in a state not listed above, but just in case.
         */
        invalid.push(task.id);
    }
    return {
        running,
        done,
        invalid,
        aborted,
        failed,
        collection
    };
};
