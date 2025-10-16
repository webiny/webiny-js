import { Result } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";
import type { GetTenantByIdUseCase as UseCase } from "./abstractions.js";

export class GetTenantByIdUseCase implements UseCase.Interface {
    constructor(private readonly getTenantById: (id: string) => Promise<Tenant>) {}

    async execute(id: string): UseCase.Result {
        const tenant = await this.getTenantById(id);

        if (!tenant) {
            return Result.fail<UseCase.Error>({ type: "NOT_FOUND" });
        }

        return Result.ok(tenant);
    }
}
