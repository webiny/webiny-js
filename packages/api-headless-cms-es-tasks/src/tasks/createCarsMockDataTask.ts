import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "~/types";
import { ICarsMockDataInput, ICarsMockDataOutput } from "~/tasks/CarsMockData/types";

export const CARS_MOCK_DATA_TASK_ID = "carsMockData";

export const createCarsMockDataTask = () => {
    return createTaskDefinition<Context, ICarsMockDataInput, ICarsMockDataOutput>({
        id: CARS_MOCK_DATA_TASK_ID,
        title: "Cars mock",
        maxIterations: 2,
        async run(params) {
            const { CarsMockData } = await import(
                /* webpackChunkName: "HeadlessCmsCarsMockData" */ "./CarsMockData/CarsMockData"
            );

            const carsMock = new CarsMockData<Context, ICarsMockDataInput, ICarsMockDataOutput>();

            try {
                return await carsMock.execute(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};
