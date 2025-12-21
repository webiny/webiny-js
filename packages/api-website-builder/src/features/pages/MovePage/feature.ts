import { createFeature } from "@webiny/feature/api";
import { MovePageRepository } from "./MovePageRepository.js";
import { MovePageUseCase } from "./MovePageUseCase.js";

export const MovePageFeature = createFeature({
    name: "WebsiteBuilder/MovePage",
    register(container) {
        container.register(MovePageRepository).inSingletonScope();
        container.register(MovePageUseCase);
    }
});
