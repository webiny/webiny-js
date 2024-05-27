import { Context, ITask, ITaskResponseResult, ITaskRunParams, TaskDataStatus } from "@webiny/tasks";
import { ICarsMockInput, ICarsMockOutput } from "~/tasks/CarsMock/types";
import { createCarsModel } from "~/tasks/CarsMock/model";
import { createGroupData } from "./group";
import { calculateAmounts } from "./calculateAmounts";
import { CARS_MOCK_DATA_TASK_ID } from "~/tasks/createCarsMockDataTask";
import { ICarsMockDataInput } from "~/tasks/CarsMockData/types";
import { calculateSeconds } from "./calculateSeconds";

export class CarsMock<C extends Context, I extends ICarsMockInput, O extends ICarsMockOutput> {
    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, isAborted, input, response, trigger, store } = params;

        const taskId = store.getTask().id;
        if (isAborted()) {
            await this.abortChildTasks(context, taskId);
            return response.aborted();
        } else if (input.seconds) {
            const items = await this.listChildTasks(context, taskId);
            if (items.length > 0) {
                for (const item of items) {
                    if (
                        item.taskStatus === TaskDataStatus.RUNNING ||
                        item.taskStatus === TaskDataStatus.PENDING
                    ) {
                        return response.continue({
                            ...input
                        });
                    }
                }
            }
            return response.done();
        }
        /**
         * First we need to check if the model already exists in the database. If not, we need to create it.
         */
        const model = (await context.cms.listModels()).find(m => m.modelId === "cars");
        if (model && !input.overwrite) {
            return response.done(`Model "cars" already exists.`);
        } else if (!model) {
            let group = (await context.cms.listGroups()).find(group => group.slug === "mocks");
            if (!group) {
                const groupData = createGroupData();
                group = await context.cms.createGroup(groupData);
            }
            /**
             * Possibly we need to create the model.
             */
            const carsModel = createCarsModel(group);
            await context.cms.createModel(carsModel);
        }

        const { amountOfTasks, amountOfRecords } = calculateAmounts(input.amount);

        const seconds = calculateSeconds(amountOfRecords);
        if (seconds === null) {
            return response.error(
                new Error(`Could not calculate seconds to run the child tasks for.`)
            );
        }

        for (let current = 0; current < amountOfTasks; current++) {
            await trigger<ICarsMockDataInput>({
                definition: CARS_MOCK_DATA_TASK_ID,
                input: {
                    totalAmount: amountOfRecords,
                    createdAmount: 0
                },
                name: `Cars Mock Data Task #${current + 1} of ${amountOfTasks}`
            });
        }

        return response.continue(
            {
                ...input,
                seconds,
                amountOfTasks,
                amountOfRecords
            },
            {
                seconds
            }
        );
    }

    private async listChildTasks(context: Context, id: string): Promise<ITask[]> {
        const { items } = await context.tasks.listTasks({
            where: {
                parentId: id
            },
            limit: 10000
        });
        return items;
    }

    private async abortChildTasks(context: Context, id: string): Promise<void> {
        const items = await this.listChildTasks(context, id);
        for (const item of items) {
            await context.tasks.abort({
                id: item.id,
                message: "Aborted by parent task."
            });
        }
    }
}
