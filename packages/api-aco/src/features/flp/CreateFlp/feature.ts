import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { CreateFlpUseCase } from "./CreateFlpUseCase.js";
import { CreateFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { AcoContext } from "~/types.js";

interface LegacyDeps {
    context: AcoContext;
}

export const CreateFlpFeature = createFeature({
    name: "CreateFlp",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new CreateFlpUseCase(deps.context);
        });
    }
});
