import { createFeature } from "@webiny/feature/api";
import { ListAllGlobalComponentsRepository } from "./ListAllGlobalComponentsRepository.js";
import { ListAllGlobalComponentsUseCase } from "./ListAllGlobalComponentsUseCase.js";

export const ListAllGlobalComponentsFeature = createFeature({
  name: "WebsiteBuilder/ListAllGlobalComponents",
  register(container) {
    container.register(ListAllGlobalComponentsRepository).inSingletonScope();
    container.register(ListAllGlobalComponentsUseCase);
  },
});
