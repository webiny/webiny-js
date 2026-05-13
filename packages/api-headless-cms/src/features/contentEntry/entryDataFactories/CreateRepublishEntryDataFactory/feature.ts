import { createFeature } from "@webiny/feature/api";
import { CreateRepublishEntryDataFactory } from "./CreateRepublishEntryDataFactory.js";

export const CreateRepublishEntryDataFactoryFeature = createFeature({
    name: "CreateRepublishEntryDataFactory",
    register(container) {
        container.register(CreateRepublishEntryDataFactory).inSingletonScope();
    }
});
