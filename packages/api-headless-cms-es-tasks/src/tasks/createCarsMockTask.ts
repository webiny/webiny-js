import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "~/types";
import { ICarsMockInput, ICarsMockOutput } from "~/tasks/CarsMock/types";

export const CARS_MOCK_TASK_ID = "carsMock";

export const createCarsMockTask = () => {
    return createTaskDefinition<Context, ICarsMockInput, ICarsMockOutput>({
        id: CARS_MOCK_TASK_ID,
        title: "Cars mock",
        maxIterations: 500,
        async run(params) {
            const { CarsMock } = await import(
                /* webpackChunkName: "HeadlessCmsCarsMock" */ "./CarsMock/CarsMock"
            );

            const carsMock = new CarsMock<Context, ICarsMockInput, ICarsMockOutput>();

            try {
                return await carsMock.execute(params);
            } catch (ex) {
                return params.response.error(ex);
            }
        }
    });
};
