import { createFeature } from "@webiny/feature/admin";
import { GetLayoutUsageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLayoutUsageUseCase } from "./GetLayoutUsageUseCase.js";

export const GetLayoutUsageFeature = createFeature({
    name: "WebsiteBuilder/GetLayoutUsage",
    register(container) {
        container.register(GetLayoutUsageUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
