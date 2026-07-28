import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { AiPowerUpsBreadcrumb } from "./AiPowerUpsBreadcrumb.js";

export const AiPowerUpsBreadcrumbsFeature = createFeature({
    name: "AiPowerUpsBreadcrumbs",
    register(container: Container) {
        container.register(AiPowerUpsBreadcrumb);
    }
});
