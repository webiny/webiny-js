import type { IGetScheduleActionExecuteParams } from "~/Gateways/index.js";

export interface IGetItemController {
    execute: (params: Omit<IGetScheduleActionExecuteParams, "app">) => Promise<void>;
}
