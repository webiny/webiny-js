import { createImplementation } from "@webiny/feature/api";
import { GetRootTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/abstractions.js";

export class GetRootTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private getTenantById: GetTenantByIdUseCase.Interface) {}

    async execute(): GetTenantByIdUseCase.Result {
        return this.getTenantById.execute("root");
    }
}

export const GetRootTenantUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRootTenantUseCaseImpl,
    dependencies: [GetTenantByIdUseCase]
});
