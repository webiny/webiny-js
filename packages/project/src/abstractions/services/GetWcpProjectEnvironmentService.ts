import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { IWcpEnvironmentModel } from "~/abstractions/models/index.js";

export interface IGetWcpProjectEnvironmentService {
    execute(): Promise<IWcpEnvironmentModel | null>;
}

export const GetWcpProjectEnvironmentService = createAbstraction<IGetWcpProjectEnvironmentService>("GetWcpProjectEnvironmentService");

export namespace GetWcpProjectEnvironmentService {
    export type Interface = IGetWcpProjectEnvironmentService;
}
