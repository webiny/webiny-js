import { createFeature } from "@webiny/feature/admin";
import { ListCustomIconsGateway } from "./ListCustomIconsGateway.js";

export const ListCustomIconsFeature = createFeature({
    name: "IconPicker/ListCustomIcons",
    register(container) {
        container.register(ListCustomIconsGateway).inSingletonScope();
    }
});
