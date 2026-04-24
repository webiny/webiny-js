import { createFeature } from "@webiny/feature/api";
import { ListApiKeysUseCase } from "./ListApiKeysUseCase.js";

export const ListApiKeysFeature = createFeature({
    name: "ListApiKeys",
    register(container) {
        container.register(ListApiKeysUseCase);
    }
});
