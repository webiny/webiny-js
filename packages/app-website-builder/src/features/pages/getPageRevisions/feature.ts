import { createFeature } from "@webiny/feature/admin";
import { GetPageRevisionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPageRevisionsUseCase } from "./GetPageRevisionsUseCase.js";
import { GetPageRevisionsRepository } from "./GetPageRevisionsRepository.js";
import { GetPageRevisionsGateway } from "./GetPageRevisionsGateway.js";
import { GetPageRevisionsUseCaseWithLoading } from "./GetPageRevisionsUseCaseWithLoading.js";
import { WbPageRevisionsLoadingRepository } from "~/features/pages/shared/abstractions.js";

export const GetPageRevisionsFeature = createFeature({
    name: "WebsiteBuilder/GetPageRevisions",
    register(container) {
        container.register(GetPageRevisionsUseCase);
        container.register(GetPageRevisionsRepository).inSingletonScope();
        container.register(GetPageRevisionsGateway).inSingletonScope();
        container.registerDecorator(GetPageRevisionsUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction),
            loadingRepository: container.resolve(WbPageRevisionsLoadingRepository)
        };
    }
});
