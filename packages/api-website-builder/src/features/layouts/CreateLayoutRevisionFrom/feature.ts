import { createFeature } from "@webiny/feature/api";
import { CreateLayoutRevisionFromRepository } from "./CreateLayoutRevisionFromRepository.js";
import { CreateLayoutRevisionFromUseCase } from "./CreateLayoutRevisionFromUseCase.js";

export const CreateLayoutRevisionFromFeature = createFeature({
    name: "WebsiteBuilder/CreateLayoutRevisionFrom",
    register(container) {
        container.register(CreateLayoutRevisionFromRepository).inSingletonScope();
        container.register(CreateLayoutRevisionFromUseCase);
    }
});
