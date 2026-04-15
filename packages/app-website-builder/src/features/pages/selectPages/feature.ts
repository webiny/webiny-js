import { createFeature } from "@webiny/feature/admin";
import { SelectPagesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SelectPagesUseCase } from "./SelectPagesUseCase.js";

export const SelectPagesFeature = createFeature({
    name: "WebsiteBuilder/SelectPages",
    register(container) {
        container.register(SelectPagesUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
