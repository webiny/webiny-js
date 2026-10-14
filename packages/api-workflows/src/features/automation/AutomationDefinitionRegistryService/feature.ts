import { createFeature } from "@webiny/feature/api";
import { AutomationDefinitionRegistryService } from "./AutomationDefinitionRegistryService.js";

export const AutomationDefinitionRegistryFeature = createFeature({
    name: "Workflows/AutomationDefinitionRegistry",
    register(container) {
        container.register(AutomationDefinitionRegistryService);
    }
});
