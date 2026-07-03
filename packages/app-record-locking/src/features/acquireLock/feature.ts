import { createFeature } from "@webiny/feature/admin";
import { AcquireLockUseCase as UseCase } from "./abstractions.js";
import { AcquireLockUseCase } from "./AcquireLockUseCase.js";
import { AcquireLockGateway } from "./AcquireLockGateway.js";

export const AcquireLockFeature = createFeature({
    name: "RecordLocking/AcquireLock",
    register(container) {
        container.register(AcquireLockUseCase);
        container.register(AcquireLockGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
