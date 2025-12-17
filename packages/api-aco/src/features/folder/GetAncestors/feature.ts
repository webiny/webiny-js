import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetAncestorsRepository } from "./GetAncestorsRepository.js";
import { GetAncestorsUseCase } from "./GetAncestorsUseCase.js";

export const GetAncestorsFeature = createFeature({
    name: "GetAncestors",
    register(container: Container) {
        container.register(GetAncestorsRepository).inSingletonScope();
        container.register(GetAncestorsUseCase);
    }
});
