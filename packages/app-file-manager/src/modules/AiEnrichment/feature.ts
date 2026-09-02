import { createFeature } from "@webiny/feature/admin";
import { AiImageEnrichmentEventHandler } from "./AiImageEnrichmentEventHandler.js";
import { ReenrichFileGateway } from "./ReenrichFileGateway.js";
import { ReenrichWithAiPresenter } from "./ReenrichWithAiPresenter.js";
import { ReenrichWithAiPresenter as PresenterAbstraction } from "./abstractions.js";

export const AiEnrichmentFeature = createFeature({
    name: "FileManager/AiEnrichment",
    register(container) {
        container.register(AiImageEnrichmentEventHandler);
        container.register(ReenrichFileGateway).inSingletonScope();
        // Singleton so the dialog's state survives re-renders of the view that reads it.
        container.register(ReenrichWithAiPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
