import { createFeature } from "@webiny/feature/api";
import { ListExperimentsRepository } from "./ListExperimentsRepository.js";
import { ListExperimentsUseCase } from "./ListExperimentsUseCase.js";

export const ListExperimentsFeature = createFeature({
    name: "WebsiteBuilder/ListExperiments",
    register(container) {
        container.register(ListExperimentsRepository).inSingletonScope();
        container.register(ListExperimentsUseCase);
    }
});
