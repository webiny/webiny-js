import { createFeature } from "@webiny/feature/api";
import { ListTaskLogsUseCase } from "./ListTaskLogsUseCase.js";

export const ListTaskLogsFeature = createFeature({
    name: "ListTaskLogs",
    register(container) {
        container.register(ListTaskLogsUseCase);
    }
});
