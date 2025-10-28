import { createFeature } from "@webiny/feature/api";
import { ListApiKeysUseCaseImpl } from "./ListApiKeysUseCase.js";

export const ListApiKeysFeature = createFeature({
    name: "ListApiKeys",
    register(container) {
        container.register(ListApiKeysUseCaseImpl);
    }
});
