import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
declare class SchedulePrivateModelImpl implements ModelFactory.Interface {
    execute(builder: ModelFactory.Builder): Promise<import("@webiny/api-headless-cms/features/modelBuilder/index.js").PrivateModelBuilder[]>;
}
export declare const SchedulePrivateModel: typeof SchedulePrivateModelImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("@webiny/api-headless-cms/features/modelBuilder/abstractions").IModelFactory>;
};
export {};
