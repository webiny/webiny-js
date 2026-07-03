import { createFeature } from "@webiny/feature/admin";
import { ReleaseLockUseCase as UseCase } from "./abstractions.js";
import { ReleaseLockUseCase } from "./ReleaseLockUseCase.js";
import { ReleaseLockGateway } from "./ReleaseLockGateway.js";

export const ReleaseLockFeature = createFeature({
    name: "RecordLocking/ReleaseLock",
    register(container) {
        container.register(ReleaseLockUseCase);
        container.register(ReleaseLockGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
