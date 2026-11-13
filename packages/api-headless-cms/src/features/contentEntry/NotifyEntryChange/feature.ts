import { createFeature } from "@webiny/feature/api";
import { NotifyEntryChangeUseCase } from "./NotifyEntryChangeUseCase.js";

/** Tells the user's open admin tabs which entry changed. Callers decide when; see the use case. */
export const NotifyEntryChangeFeature = createFeature({
    name: "HeadlessCms/NotifyEntryChange",
    register(container) {
        container.register(NotifyEntryChangeUseCase);
    }
});
