import { createFeature } from "@webiny/feature/api";
import { GetScheduledActionUseCase } from "./GetScheduledActionUseCase.js";
const GetScheduledActionFeature = createFeature({
    name: "GetScheduledAction",
    register (container) {
        container.register(GetScheduledActionUseCase);
    }
});
export { GetScheduledActionFeature };

//# sourceMappingURL=feature.js.map