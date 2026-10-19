import { createFeature } from "@webiny/feature/admin";
import { AiImageEnrichmentEventHandler } from "./AiImageEnrichmentEventHandler.js";
import { AiImageEnrichmentFailedEventHandler } from "./AiImageEnrichmentFailedEventHandler.js";
import { ReenrichFileGateway } from "./ReenrichFileGateway.js";
import { ReenrichWithAiPresenter } from "./ReenrichWithAiPresenter.js";
import { ReenrichWithAiPresenter as PresenterAbstraction } from "./abstractions.js";

export const AiEnrichmentFeature = createFeature({
    name: "FileManager/AiEnrichment",
    register(container) {
        container.register(AiImageEnrichmentEventHandler);
        container.register(AiImageEnrichmentFailedEventHandler);
        container.register(ReenrichFileGateway).inSingletonScope();
        // One per container, so the dialog's state survives re-renders of the view that reads it. Not
        // a singleton: the presenter reads FileDetailsPresenter, which only the File Manager view's
        // child container registers, and a container-scoped instance is built from that child.
        container.register(ReenrichWithAiPresenter).inContainerScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
