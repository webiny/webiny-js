import { createFeature } from "@webiny/feature/api";
import { ListVisibleTaskLogsUseCase } from "./ListVisibleTaskLogsUseCase.js";

export const ListVisibleTaskLogsFeature = createFeature({
    name: "ListVisibleTaskLogs",
    register(container) {
        container.register(ListVisibleTaskLogsUseCase);
    }
});
