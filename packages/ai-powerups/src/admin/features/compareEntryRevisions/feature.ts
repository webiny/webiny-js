import { createFeature } from "@webiny/feature/admin";
import { CompareEntryRevisionsUseCase } from "./CompareEntryRevisionsUseCase.js";
import { CompareEntryRevisionsRepository } from "./CompareEntryRevisionsRepository.js";
import { CompareEntryRevisionsGateway } from "./CompareEntryRevisionsGateway.js";

export const CompareEntryRevisionsFeature = createFeature({
    name: "AiPowerUps/CompareEntryRevisions",
    register(container) {
        container.register(CompareEntryRevisionsUseCase);
        container.register(CompareEntryRevisionsRepository).inSingletonScope();
        container.register(CompareEntryRevisionsGateway).inSingletonScope();
    }
});
