import { createFeature } from "@webiny/feature/api";
import { CancelScheduledActionUseCase } from "./CancelScheduledActionUseCase.js";
const CancelScheduledActionFeature = createFeature({
    name: "CancelScheduledAction",
    register (container) {
        container.register(CancelScheduledActionUseCase);
    }
});
export { CancelScheduledActionFeature };

//# sourceMappingURL=feature.js.map