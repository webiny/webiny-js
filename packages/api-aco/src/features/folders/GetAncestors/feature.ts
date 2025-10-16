import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { GetAncestorsUseCase } from "./GetAncestorsUseCase.js";

export const GetAncestorsFeature = createFeature({
    name: "GetAncestors",
    register(container: Container) {
        container.register(GetAncestorsUseCase);
    }
});
