import { createFeature } from "@webiny/feature";
import { GetCurrentTenantUseCase } from "./abstractions.js";
import { GetCurrentTenantUseCase as GetCurrentTenantUseCaseImpl } from "./GetCurrentTenantUseCase.js";
import type { TenancyContext } from "~/types.js";

export { GetCurrentTenantUseCase };

export const GetCurrentTenant = createFeature({
    name: "GetCurrentTenant",
    register(container, context: TenancyContext) {
        container.registerFactory(GetCurrentTenantUseCase, () => {
            return new GetCurrentTenantUseCaseImpl(() => context.tenancy.getCurrentTenant());
        });
    }
});
