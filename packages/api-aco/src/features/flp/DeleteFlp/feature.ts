import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { DeleteFlpUseCase } from "./DeleteFlpUseCase.js";
import { DeleteFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { AcoContext } from "~/types.js";

interface LegacyDeps {
    context: AcoContext;
}

export const DeleteFlpFeature = createFeature({
    name: "DeleteFlp",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new DeleteFlpUseCase(deps.context);
        });
    }
});
