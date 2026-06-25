import { createFeature } from "@webiny/feature/admin";
import { CheckLockStatusUseCase as UseCase } from "./abstractions.js";
import { CheckLockStatusUseCase } from "./CheckLockStatusUseCase.js";
import { CheckLockStatusGateway } from "./CheckLockStatusGateway.js";

export const CheckLockStatusFeature = createFeature({
    name: "RecordLocking/CheckLockStatus",
    register(container) {
        container.register(CheckLockStatusUseCase);
        container.register(CheckLockStatusGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
