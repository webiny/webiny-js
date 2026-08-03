import { createFeature } from "@webiny/feature/admin";
import { ThemesRepository as RepositoryAbstraction } from "./abstractions.js";
import { ThemesRepository } from "./ThemesRepository.js";

export const ThemesFeature = createFeature({
    name: "Theme/Themes",
    register(container) {
        container.register(ThemesRepository).inSingletonScope();
    },
    resolve(container) {
        return { repository: container.resolve(RepositoryAbstraction) };
    }
});
