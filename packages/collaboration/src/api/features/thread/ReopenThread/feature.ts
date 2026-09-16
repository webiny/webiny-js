import { createFeature } from "@webiny/feature/api";
import { ReopenThreadUseCase } from "./ReopenThreadUseCase.js";

export const ReopenThreadFeature = createFeature({
    name: "Collaboration/ReopenThread",
    register(container) {
        container.register(ReopenThreadUseCase);
    }
});
