import { Abstraction } from "@webiny/di";

export interface IDeployedEnvironment {
    env: string;
    variant?: string;
}

export interface IListDeployedEnvironmentsService {
    execute(): Promise<IDeployedEnvironment[]>;
}

export const ListDeployedEnvironmentsService = new Abstraction<IListDeployedEnvironmentsService>(
    "ListDeployedEnvironmentsService"
);

export namespace ListDeployedEnvironmentsService {
    export type Interface = IListDeployedEnvironmentsService;
    export type Result = IDeployedEnvironment[];
}
