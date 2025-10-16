import { createFeature } from "@webiny/feature/api";
import { GetTenantByIdUseCase } from "./abstractions.js";
import { GetTenantByIdUseCase as GetTenantByIdUseCaseImpl } from "./GetTenantByIdUseCase.js";
import type { TenancyContext } from "~/types.js";

export { GetTenantByIdUseCase };

export const GetTenantById = createFeature({
    name: "GetTenantById",
    register(container, context: TenancyContext) {
        container.registerFactory(GetTenantByIdUseCase, () => {
            return new GetTenantByIdUseCaseImpl((id: string) => context.tenancy.getTenantById(id));
        });
    }
});
