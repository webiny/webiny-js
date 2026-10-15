import { createFeature } from "@webiny/feature/api";
import { ListWorkflowNotificationTransportsUseCase } from "./ListWorkflowNotificationTransportsUseCase.js";

export const ListWorkflowNotificationTransportsFeature = createFeature({
    name: "Workflows/ListWorkflowNotificationTransports",
    register(container) {
        container.register(ListWorkflowNotificationTransportsUseCase);
    }
});
