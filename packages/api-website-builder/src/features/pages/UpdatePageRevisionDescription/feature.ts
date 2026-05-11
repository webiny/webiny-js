import { createFeature } from "@webiny/feature/api";
import { UpdatePageRevisionDescriptionRepository } from "./UpdatePageRevisionDescriptionRepository.js";
import { UpdatePageRevisionDescriptionUseCase } from "./UpdatePageRevisionDescriptionUseCase.js";

export const UpdatePageRevisionDescriptionFeature = createFeature({
    name: "WebsiteBuilder/UpdatePageRevisionDescription",
    register(container) {
        container.register(UpdatePageRevisionDescriptionRepository).inSingletonScope();
        container.register(UpdatePageRevisionDescriptionUseCase);
    }
});
