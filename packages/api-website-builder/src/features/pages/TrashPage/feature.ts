import { createFeature } from "@webiny/feature/api";
import { TrashPageRepository } from "./TrashPageRepository.js";
import { TrashPageUseCase } from "./TrashPageUseCase.js";

export const TrashPageFeature = createFeature({
    name: "WebsiteBuilder/TrashPage",
    register(container) {
        container.register(TrashPageRepository).inSingletonScope();
        container.register(TrashPageUseCase);
    }
});
