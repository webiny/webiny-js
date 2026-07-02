import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { CreateFlpUseCase } from "./CreateFlpUseCase.js";
import { CreateFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";

export const CreateFlpFeature = createFeature({
    name: "CreateFlp",
    register(container: Container) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new CreateFlpUseCase(container.resolve(AcoFlpCrud));
        });
    }
});
