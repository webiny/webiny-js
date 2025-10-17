import type { GetRootTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTenantByIdUseCase } from "~/features/GetTenantById/abstractions.js";

export class GetRootTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(private getTenantById: GetTenantByIdUseCase.Interface) {}

    async execute(): GetTenantByIdUseCase.Result {
        return this.getTenantById.execute("root");
    }
}
