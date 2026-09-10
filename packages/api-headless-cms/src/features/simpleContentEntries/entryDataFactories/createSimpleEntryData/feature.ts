import { createFeature } from "@webiny/feature/api";
import { CreateSimpleEntryDataFactory } from "./CreateSimpleEntryDataFactory.js";

export const CreateSimpleEntryDataFactoryFeature = createFeature({
    name: "CreateSimpleEntryDataFactory",
    register(container) {
        container.register(CreateSimpleEntryDataFactory).inSingletonScope();
    }
});
