import { createFeature } from "@webiny/feature/api";
import { ListTaskDefinitionsUseCase } from "./ListTaskDefinitionsUseCase.js";

export const ListTaskDefinitionsFeature = createFeature({
    name: "ListTaskDefinitions",
    register(container) {
        container.register(ListTaskDefinitionsUseCase);
    }
});
