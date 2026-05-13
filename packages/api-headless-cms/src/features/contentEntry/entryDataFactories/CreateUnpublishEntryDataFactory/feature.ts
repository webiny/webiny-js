import { createFeature } from "@webiny/feature/api";
import { CreateUnpublishEntryDataFactory } from "./CreateUnpublishEntryDataFactory.js";

export const CreateUnpublishEntryDataFactoryFeature = createFeature({
    name: "CreateUnpublishEntryDataFactory",
    register(container) {
        container.register(CreateUnpublishEntryDataFactory).inSingletonScope();
    }
});
