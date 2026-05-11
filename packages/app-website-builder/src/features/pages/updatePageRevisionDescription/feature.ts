import { createFeature } from "@webiny/feature/admin";
import { UpdatePageRevisionDescriptionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdatePageRevisionDescriptionUseCase } from "./UpdatePageRevisionDescriptionUseCase.js";
import { UpdatePageRevisionDescriptionRepository } from "./UpdatePageRevisionDescriptionRepository.js";
import { UpdatePageRevisionDescriptionGateway } from "./UpdatePageRevisionDescriptionGateway.js";
import { UpdatePageRevisionDescriptionUseCaseWithLoading } from "./UpdatePageRevisionDescriptionUseCaseWithLoading.js";

export const UpdatePageRevisionDescriptionFeature = createFeature({
    name: "WebsiteBuilder/UpdatePageRevisionDescription",
    register(container) {
        container.register(UpdatePageRevisionDescriptionUseCase);
        container.register(UpdatePageRevisionDescriptionRepository).inSingletonScope();
        container.register(UpdatePageRevisionDescriptionGateway).inSingletonScope();
        container.registerDecorator(UpdatePageRevisionDescriptionUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
