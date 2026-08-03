import { createFeature } from "@webiny/feature/api";
import { ThemeArtifactService } from "./ThemeArtifactService.js";

export const ThemeArtifactsFeature = createFeature({
    name: "Theme/ThemeArtifacts",
    register(container) {
        container.register(ThemeArtifactService).inSingletonScope();
    }
});
