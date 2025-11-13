import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IDeployedEnvironment {
    env: string;
    variant?: string;
}

export interface IListDeployedEnvironmentsService {
    execute(): Promise<IDeployedEnvironment[]>;
}

export const ListDeployedEnvironmentsService = createAbstraction<IListDeployedEnvironmentsService>(
    "ListDeployedEnvironmentsService"
);

export namespace ListDeployedEnvironmentsService {
    export type Interface = IListDeployedEnvironmentsService;
    export type Result = IDeployedEnvironment[];
}
