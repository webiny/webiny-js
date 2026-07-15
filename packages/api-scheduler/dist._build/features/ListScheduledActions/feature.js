import { createFeature } from "@webiny/feature/api";
import { ListScheduledActionsUseCase } from "./ListScheduledActionsUseCase.js";
const ListScheduledActionsFeature = createFeature({
    name: "ListScheduledActions",
    register (container) {
        container.register(ListScheduledActionsUseCase);
    }
});
export { ListScheduledActionsFeature };

//# sourceMappingURL=feature.js.map