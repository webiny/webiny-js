import { Result } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";
import type { GetCurrentTenantUseCase as UseCase } from "./abstractions.js";

export class GetCurrentTenantUseCase implements UseCase.Interface {
    constructor(private readonly getCurrentTenant: () => Tenant) {}

    execute(): UseCase.Result {
        return Result.ok(this.getCurrentTenant());
    }
}
