import { createFeature } from "@webiny/feature/api";
import { GetTargetScheduledActionUseCase } from "./GetTargetScheduledActionUseCase.js";
const GetTargetScheduledActionFeature = createFeature({
    name: "GetTargetScheduledAction",
    register (container) {
        container.register(GetTargetScheduledActionUseCase);
    }
});
export { GetTargetScheduledActionFeature };

//# sourceMappingURL=feature.js.map