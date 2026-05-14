import { createFeature } from "@webiny/feature/api";
import { UpdateEntryDataFactory } from "./UpdateEntryDataFactory.js";

export const UpdateEntryDataFactoryFeature = createFeature({
    name: "UpdateEntryDataFactory",
    register(container) {
        container.register(UpdateEntryDataFactory).inSingletonScope();
    }
});
