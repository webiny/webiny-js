import { createFeature } from "@webiny/feature/api";
import { ScheduleActionUseCase } from "./ScheduleActionUseCase.js";
const ScheduleActionFeature = createFeature({
    name: "ScheduleAction",
    register (container) {
        container.register(ScheduleActionUseCase);
    }
});
export { ScheduleActionFeature };

//# sourceMappingURL=feature.js.map