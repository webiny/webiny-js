import { createAbstraction } from "@webiny/feature/api";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";

// Use Case Abstraction
export interface IGetRootTenantUseCase {
    execute(): GetTenantByIdUseCase.Result;
}

export const GetRootTenantUseCase =
    createAbstraction<IGetRootTenantUseCase>("GetRootTenantUseCase");

export namespace GetRootTenantUseCase {
    export type Interface = IGetRootTenantUseCase;
}
