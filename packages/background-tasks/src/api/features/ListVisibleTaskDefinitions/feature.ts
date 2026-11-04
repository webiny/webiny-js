import { createFeature } from "@webiny/feature/api";
import { ListVisibleTaskDefinitionsUseCase } from "./ListVisibleTaskDefinitionsUseCase.js";

export const ListVisibleTaskDefinitionsFeature = createFeature({
    name: "ListVisibleTaskDefinitions",
    register(container) {
        container.register(ListVisibleTaskDefinitionsUseCase);
    }
});
