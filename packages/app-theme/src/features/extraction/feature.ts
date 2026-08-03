import { createFeature } from "@webiny/feature/admin";
import {
    ExtractionRepository as RepositoryAbstraction,
    ExtractionRepositoryImplementation
} from "./ExtractionRepository.js";

/**
 * A singleton, so an extraction survives the dialog being closed.
 *
 * The run is minutes long and the user should be free to close the dialog and carry on working; the
 * progress state has to outlive the component that started it.
 */
export const ExtractionFeature = createFeature({
    name: "Theme/Extraction",
    register(container) {
        container.register(ExtractionRepositoryImplementation).inSingletonScope();
    },
    resolve(container) {
        return { repository: container.resolve(RepositoryAbstraction) };
    }
});
