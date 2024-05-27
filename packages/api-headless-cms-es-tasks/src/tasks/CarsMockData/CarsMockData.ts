import { Context, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { ICarsMockDataInput, ICarsMockDataOutput } from "./types";
import { CmsModelManager } from "@webiny/api-headless-cms/types";
import { createMockData } from "~/tasks/CarsMockData/mockData";

export interface ICarsMockDataParams {}

export class CarsMockData<
    C extends Context,
    I extends ICarsMockDataInput,
    O extends ICarsMockDataOutput
> {
    public constructor(params: ICarsMockDataParams = {}) {}

    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, isAborted, input, store, response, trigger, isCloseToTimeout } = params;

        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue({
                ...input
            });
        }

        let manager: CmsModelManager;
        try {
            manager = await context.cms.getEntryManager("cars");
        } catch (ex) {
            return response.error(ex);
        }

        const max = input.totalAmount - input.createdAmount;

        for (let createdAmount = input.createdAmount; createdAmount < max; createdAmount++) {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input,
                    createdAmount
                });
            }
            try {
                await manager.create(createMockData());
            } catch (ex) {
                return response.error(ex);
            }
        }

        return params.response.done();
    }
}
