import { createFeature } from "@webiny/feature/api";
import { ListAutomationDefinitionsUseCase } from "./ListAutomationDefinitionsUseCase.js";

export const ListAutomationDefinitionsFeature = createFeature({
    name: "Workflows/ListAutomationDefinitions",
    register(container) {
        container.register(ListAutomationDefinitionsUseCase);
    }
});
