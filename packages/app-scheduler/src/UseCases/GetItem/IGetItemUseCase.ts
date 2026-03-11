import type { IGetScheduleActionExecuteParams } from "~/Gateways/index.js";

export interface IGetItemUseCase {
    execute: (params: Omit<IGetScheduleActionExecuteParams, "app">) => Promise<void>;
}
