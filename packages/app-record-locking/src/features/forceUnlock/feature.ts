import { createFeature } from "@webiny/feature/admin";
import { ForceUnlockUseCase as UseCase } from "./abstractions.js";
import { ForceUnlockUseCase } from "./ForceUnlockUseCase.js";
import { ForceUnlockGateway } from "./ForceUnlockGateway.js";

export const ForceUnlockFeature = createFeature({
    name: "RecordLocking/ForceUnlock",
    register(container) {
        container.register(ForceUnlockUseCase);
        container.register(ForceUnlockGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
