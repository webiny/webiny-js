import { createFeature } from "@webiny/feature/admin";
import { MultiValueDynamicZonePresenter } from "./MultiValueDynamicZonePresenter.js";

export const MultiValueDynamicZoneFeature = createFeature({
    name: "MultiValueDynamicZone",
    register(container) {
        container.register(MultiValueDynamicZonePresenter);
    }
});
