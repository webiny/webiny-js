import { createFeature } from "@webiny/feature/api";
import { ListPagesRepository } from "./ListPagesRepository.js";
import { ListPagesUseCase } from "./ListPagesUseCase.js";

export const ListPagesFeature = createFeature({
    name: "WebsiteBuilder/ListPages",
    register(container) {
        container.register(ListPagesRepository).inSingletonScope();
        container.register(ListPagesUseCase);
    }
});
