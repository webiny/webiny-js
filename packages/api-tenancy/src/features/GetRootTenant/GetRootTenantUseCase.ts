import { Result } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";
import type { GetRootTenantUseCase as UseCase } from "./abstractions.js";

export class GetRootTenantUseCase implements UseCase.Interface {
    constructor(private readonly getRootTenant: () => Promise<Tenant>) {}

    async execute(): UseCase.Result {
        return Result.ok(await this.getRootTenant());
    }
}
