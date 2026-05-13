import { createFeature } from "@webiny/feature/api";
import { CreatePublishEntryDataFactory } from "./CreatePublishEntryDataFactory.js";

export const CreatePublishEntryDataFactoryFeature = createFeature({
    name: "CreatePublishEntryDataFactory",
    register(container) {
        container.register(CreatePublishEntryDataFactory).inSingletonScope();
    }
});
