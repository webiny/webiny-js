import { createFeature } from "@webiny/feature/api";
import { SetModelFieldRendererUseCase } from "./SetModelFieldRendererUseCase.js";

export const SetModelFieldRendererFeature = createFeature({
    name: "RemoteComponents/SetModelFieldRenderer",
    register(container) {
        container.register(SetModelFieldRendererUseCase);
    }
});
