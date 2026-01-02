import { createFeature } from "@webiny/feature/api";
import { CreatePageRevisionFromRepository } from "./CreatePageRevisionFromRepository.js";
import { CreatePageRevisionFromUseCase } from "./CreatePageRevisionFromUseCase.js";

export const CreatePageRevisionFromFeature = createFeature({
    name: "WebsiteBuilder/CreatePageRevisionFrom",
    register(container) {
        container.register(CreatePageRevisionFromRepository).inSingletonScope();
        container.register(CreatePageRevisionFromUseCase);
    }
});
