import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { UpdateFlpUseCase } from "./UpdateFlpUseCase.js";
import { UpdateFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { AcoContext } from "~/types.js";

interface LegacyDeps {
    context: AcoContext;
}

export const UpdateFlpFeature = createFeature({
    name: "UpdateFlp",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new UpdateFlpUseCase(deps.context);
        });
    }
});
