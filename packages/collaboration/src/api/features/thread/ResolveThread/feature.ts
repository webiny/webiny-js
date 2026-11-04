import { createFeature } from "@webiny/feature/api";
import { ResolveThreadUseCase } from "./ResolveThreadUseCase.js";

export const ResolveThreadFeature = createFeature({
    name: "Collaboration/ResolveThread",
    register(container) {
        container.register(ResolveThreadUseCase);
    }
});
