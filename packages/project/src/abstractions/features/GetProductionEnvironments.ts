import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGetProductionEnvironments {
    execute(): Promise<string[]>;
}

export const GetProductionEnvironments = createAbstraction<IGetProductionEnvironments>(
    "GetProductionEnvironments"
);

export namespace GetProductionEnvironments {
    export type Interface = IGetProductionEnvironments;
}
