import { createFeature } from "@webiny/feature/api";
import { ListDeletedPagesRepository } from "./ListDeletedPagesRepository.js";
import { ListDeletedPagesUseCase } from "./ListDeletedPagesUseCase.js";

export const ListDeletedPagesFeature = createFeature({
    name: "WebsiteBuilder/ListDeletedPages",
    register(container) {
        container.register(ListDeletedPagesRepository).inSingletonScope();
        container.register(ListDeletedPagesUseCase);
    }
});
