import { createFeature } from "@webiny/feature/api";
import { ListLayoutsBySlugRepository } from "./ListLayoutsBySlugRepository.js";
import { LayoutSlugAvailability } from "./LayoutSlugAvailability.js";

export const LayoutSlugsFeature = createFeature({
    name: "WebsiteBuilder/LayoutSlugs",
    register(container) {
        container.register(ListLayoutsBySlugRepository).inSingletonScope();
        container.register(LayoutSlugAvailability);
    }
});
