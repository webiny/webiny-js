import { createFeature } from "webiny/admin";
import { TranslatePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TranslatePageUseCase } from "./TranslatePageUseCase.js";
import { TranslatePageRepository } from "./TranslatePageRepository.js";
import { TranslatePageGateway } from "./TranslatePageGateway.js";

export const TranslatePageFeature = createFeature({
    name: "WebsiteBuilder/TranslatePage",
    register(container) {
        container.register(TranslatePageUseCase);
        container.register(TranslatePageRepository).inSingletonScope();
        container.register(TranslatePageGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
