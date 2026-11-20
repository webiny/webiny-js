import { createFeature } from "@webiny/feature/api";
import { NotifyRecordChangeUseCase } from "./NotifyRecordChangeUseCase.js";

/** Tells the user's open admin tabs when a record is created, updated or deleted on the server. */
export const NotifyRecordChangeFeature = createFeature({
    name: "NotifyRecordChange",
    register(container) {
        container.register(NotifyRecordChangeUseCase);
    }
});
