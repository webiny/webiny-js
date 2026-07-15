import { createFeature } from "@webiny/feature/api";
import { ExecuteScheduledActionUseCase } from "./ExecuteScheduledActionUseCase.js";
import { ScheduledActionHandlerComposite } from "./ScheduledActionHandlerComposite.js";
const ExecuteScheduledActionFeature = createFeature({
    name: "ExecuteScheduledAction",
    register (container) {
        container.register(ExecuteScheduledActionUseCase);
        container.registerComposite(ScheduledActionHandlerComposite);
    }
});
export { ExecuteScheduledActionFeature };

//# sourceMappingURL=feature.js.map