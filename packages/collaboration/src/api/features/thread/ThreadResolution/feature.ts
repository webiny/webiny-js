import { createFeature } from "@webiny/feature/api";
import { ResolveThreadUseCase } from "./ResolveThreadUseCase.js";
import { ReopenThreadUseCase } from "./ReopenThreadUseCase.js";

export const ThreadResolutionFeature = createFeature({
    name: "Collaboration/ThreadResolution",
    register(container) {
        container.register(ResolveThreadUseCase);
        container.register(ReopenThreadUseCase);
    }
});
