import { createFeature } from "@webiny/feature/api";
import { ListLanguagesRepository } from "./ListLanguagesRepository.js";
import { ListLanguagesUseCase } from "./ListLanguagesUseCase.js";

export const ListLanguagesFeature = createFeature({
    name: "Languages/ListLanguages",
    register(container) {
        container.register(ListLanguagesRepository).inSingletonScope();
        container.register(ListLanguagesUseCase);
    }
});
