import { createFeature } from "@webiny/feature/api";
import { ListTagsRepository } from "./ListTagsRepository.js";
import { ListTagsUseCase } from "./ListTagsUseCase.js";

export const ListTagsFeature = createFeature({
    name: "FileManager/ListTags",
    register(container) {
        container.register(ListTagsUseCase);
        container.register(ListTagsRepository).inSingletonScope();
    }
});
