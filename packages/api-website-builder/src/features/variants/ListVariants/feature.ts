import { createFeature } from "@webiny/feature/api";
import { ListVariantsRepository } from "./ListVariantsRepository.js";
import { ListVariantsUseCase } from "./ListVariantsUseCase.js";

export const ListVariantsFeature = createFeature({
    name: "WebsiteBuilder/ListVariants",
    register(container) {
        container.register(ListVariantsRepository).inSingletonScope();
        container.register(ListVariantsUseCase);
    }
});
