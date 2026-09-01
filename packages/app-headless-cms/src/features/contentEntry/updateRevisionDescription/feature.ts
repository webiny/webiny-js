import { createFeature } from "@webiny/feature/admin";
import { UpdateRevisionDescriptionUseCase as UseCase } from "./abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "./UpdateRevisionDescriptionUseCase.js";
import { UpdateRevisionDescriptionRepository } from "./UpdateRevisionDescriptionRepository.js";
import { UpdateRevisionDescriptionGateway } from "./UpdateRevisionDescriptionGateway.js";

export const UpdateRevisionDescriptionFeature = createFeature({
    name: "CmsContentEntry/UpdateRevisionDescription",
    register(container) {
        container.register(UpdateRevisionDescriptionUseCase);
        container.register(UpdateRevisionDescriptionRepository).inSingletonScope();
        container.register(UpdateRevisionDescriptionGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
