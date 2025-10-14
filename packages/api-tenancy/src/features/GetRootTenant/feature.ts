import { createFeature } from "@webiny/feature";
import { GetRootTenantUseCase } from "./abstractions.js";
import { GetRootTenantUseCase as GetRootTenantUseCaseImpl } from "./GetRootTenantUseCase.js";
import type { TenancyContext } from "~/types.js";

export { GetRootTenantUseCase };

export const GetRootTenant = createFeature({
    name: "GetRootTenant",
    register(container, context: TenancyContext) {
        container.registerFactory(GetRootTenantUseCase, () => {
            return new GetRootTenantUseCaseImpl(() => context.tenancy.getRootTenant());
        });
    }
});
