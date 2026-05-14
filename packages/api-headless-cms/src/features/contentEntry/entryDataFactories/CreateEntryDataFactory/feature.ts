import { createFeature } from "@webiny/feature/api";
import { CreateEntryDataFactory } from "./CreateEntryDataFactory.js";

export const CreateEntryDataFactoryFeature = createFeature({
    name: "CreateEntryDataFactory",
    register(container) {
        container.register(CreateEntryDataFactory).inSingletonScope();
    }
});
